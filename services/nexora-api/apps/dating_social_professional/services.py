from datetime import date
from math import asin, cos, radians, sin, sqrt

from django.db import IntegrityError, transaction
from django.db.models import Q, Prefetch

from apps.identity.models import NexoraUser

from .models import DatingBlock, DatingConversation, DatingMatch, DatingProfile, DatingProfileMedia, DatingReport, DatingSwipe
from .notifications.service import DatingNotificationService


class DatingSafetyService:
    @staticmethod
    @transaction.atomic
    def block(*, actor: NexoraUser, target: NexoraUser) -> DatingBlock:
        if actor.id == target.id:
            raise ValueError("A user cannot block themselves.")
        block, _ = DatingBlock.objects.get_or_create(blocker=actor, blocked=target)
        matches = DatingMatch.objects.filter(Q(user_a=actor, user_b=target) | Q(user_a=target, user_b=actor))
        matches.update(active=False)
        DatingConversation.objects.filter(match__in=matches).update(active=False)
        return block

    @staticmethod
    def report(*, actor: NexoraUser, target: NexoraUser, reason: str, details: str = "") -> DatingReport:
        if actor.id == target.id:
            raise ValueError("A user cannot report themselves.")
        return DatingReport.objects.create(reporter=actor, reported=target, reason=reason, details=details)

    @staticmethod
    @transaction.atomic
    def unmatch(*, actor: NexoraUser, match_id) -> DatingMatch:
        match = DatingMatch.objects.select_for_update().filter(id=match_id).first()
        if not match or actor.id not in {match.user_a_id, match.user_b_id}:
            raise ValueError("Match not found.")
        match.active = False
        match.save(update_fields=["active", "updated_at"])
        DatingConversation.objects.filter(match=match).update(active=False)
        return match


class DatingSwipeService:
    @staticmethod
    @transaction.atomic
    def record(*, actor: NexoraUser, target_profile: DatingProfile, action: str) -> tuple[DatingSwipe, DatingMatch | None]:
        if target_profile.user_id == actor.id:
            raise ValueError("A user cannot swipe on their own profile.")
        if target_profile.user.status != NexoraUser.Status.ACTIVE:
            raise ValueError("This profile is unavailable.")
        if not target_profile.discovery_enabled: 
            raise ValueError("This profile is unavailable.")
            raise ValueError("A user cannot swipe on their own profile.")
        if DatingBlock.objects.filter(Q(blocker=actor, blocked=target_profile.user) | Q(blocker=target_profile.user, blocked=actor)).exists():
            raise ValueError("This profile is unavailable.")

        swipe, _ = DatingSwipe.objects.get_or_create(
            actor=actor,
            target=target_profile,
            defaults={"action": action},
        )
        if swipe.action != action:
            swipe.action = action
            swipe.save(update_fields=["action", "updated_at"])

        if action != DatingSwipe.Action.LIKE:
            return swipe, None

        reciprocal = DatingSwipe.objects.filter(
            actor=target_profile.user,
            target__user=actor,
            action=DatingSwipe.Action.LIKE,
        ).exists()
        if not reciprocal:
            return swipe, None

        first, second = sorted((actor.id, target_profile.user_id), key=str)
        try:
            with transaction.atomic():
                match, created = DatingMatch.objects.get_or_create(user_a_id=first, user_b_id=second)
                reactivated = False
                if not match.active:
                    match.active = True
                    match.save(update_fields=["active", "updated_at"])
                    reactivated = True
                if created or reactivated:
                    DatingNotificationService.create_and_dispatch(
                        recipient_id=actor.id,
                        notification_type="match",
                        title="New match",
                        body="You have a new match.",
                        data={"match_id": str(match.id)},
                    )
                    DatingNotificationService.create_and_dispatch(
                        recipient_id=target_profile.user_id,
                        notification_type="match",
                        title="New match",
                        body="You have a new match.",
                        data={"match_id": str(match.id)},
                    )
        except IntegrityError:
            match = DatingMatch.objects.get(user_a_id=first, user_b_id=second)
        return swipe, match


def _age_on_date(birth_date: date | None, today: date) -> int | None:
    if not birth_date:
        return None
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def _age_matches_preference(age: int | None, minimum: int, maximum: int) -> bool:
    return age is None or minimum <= age <= maximum


def _distance_km(first: DatingProfile, second: DatingProfile) -> float | None:
    if first.location_latitude is None or first.location_longitude is None:
        return None
    if second.location_latitude is None or second.location_longitude is None:
        return None
    lat1, lon1 = radians(float(first.location_latitude)), radians(float(first.location_longitude))
    lat2, lon2 = radians(float(second.location_latitude)), radians(float(second.location_longitude))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    haversine = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(haversine))


def _compatibility_score(actor: DatingProfile, candidate: DatingProfile, today: date) -> float:
    score = 0.0

    if actor.relationship_intent and candidate.relationship_intent == actor.relationship_intent:
        score += 30.0

    actor_age = _age_on_date(actor.birth_date, today)
    candidate_age = _age_on_date(candidate.birth_date, today)
    if candidate_age is not None and _age_matches_preference(candidate_age, actor.preferred_min_age, actor.preferred_max_age):
        score += 20.0
    if actor_age is not None and _age_matches_preference(actor_age, candidate.preferred_min_age, candidate.preferred_max_age):
        score += 10.0

    actor_interests = {str(value).strip().casefold() for value in (actor.interests or []) if str(value).strip()}
    candidate_interests = {str(value).strip().casefold() for value in (candidate.interests or []) if str(value).strip()}
    if actor_interests and candidate_interests:
        overlap = len(actor_interests & candidate_interests) / max(1, len(actor_interests | candidate_interests))
        score += 20.0 * overlap

    distance = _distance_km(actor, candidate)
    if distance is not None:
        if distance <= actor.max_distance_km:
            score += 10.0
            if distance <= min(actor.max_distance_km, candidate.max_distance_km):
                score += 5.0
    elif actor.location_city and candidate.location_city and actor.location_city.casefold() == candidate.location_city.casefold():
        score += 15.0

    if actor.education and candidate.education and actor.education.casefold() == candidate.education.casefold():
        score += 2.5
    if actor.occupation and candidate.occupation and actor.occupation.casefold() == candidate.occupation.casefold():
        score += 2.5

    return round(min(score, 100.0), 2)


def _ranked_candidates_for(
    actor: NexoraUser,
    *,
    intent: str | None = None,
    education: str | None = None,
    occupation: str | None = None,
    city: str | None = None,
    interest: str | None = None,
    max_distance_km: int | None = None,
):
    actor_profile = DatingProfile.objects.filter(user=actor).first()
    excluded = DatingSwipe.objects.filter(actor=actor).values_list("target_id", flat=True)
    blocked_pairs = DatingBlock.objects.filter(Q(blocker=actor) | Q(blocked=actor)).values_list("blocker_id", "blocked_id")
    blocked_user_ids = {user_id for pair in blocked_pairs for user_id in pair}
    queryset = (
        DatingProfile.objects.filter(discovery_enabled=True)
        .exclude(user=actor)
        .exclude(user_id__in=blocked_user_ids)
        .exclude(id__in=excluded)
        .exclude(user__status__in=[NexoraUser.Status.SUSPENDED, NexoraUser.Status.DISABLED, NexoraUser.Status.DELETED])
    )
    if actor_profile:
        effective_intent = intent or actor_profile.relationship_intent
        if effective_intent:
            queryset = queryset.filter(relationship_intent=effective_intent)
        queryset = queryset.filter(birth_date__isnull=False)
    if education:
        queryset = queryset.filter(education__icontains=education)
    if occupation:
        queryset = queryset.filter(occupation__icontains=occupation)
    if city:
        queryset = queryset.filter(location_city__icontains=city)
    if interest:
        queryset = queryset.filter(interests__icontains=interest)

    candidates = list(
        queryset.select_related("user")
        .prefetch_related(
            Prefetch(
                "media",
                queryset=DatingProfileMedia.objects.filter(active=True).only("id", "profile_id", "active"),
                to_attr="_active_media",
            )
        )
        .only(
            "id", "user_id", "display_name", "birth_date", "bio", "photo_url",
            "relationship_intent", "discovery_enabled", "preferred_min_age", "preferred_max_age",
            "interests", "education", "occupation", "location_city", "location_country",
            "location_latitude", "location_longitude", "max_distance_km", "updated_at",
        )
    )
    if not actor_profile:
        return [(0.0, candidate) for candidate in candidates]

    today = date.today()
    ranked = []
    actor_age = _age_on_date(actor_profile.birth_date, today)
    effective_max_distance = max_distance_km if max_distance_km is not None else actor_profile.max_distance_km
    for candidate in candidates:
        candidate_age = _age_on_date(candidate.birth_date, today)
        if candidate_age is None:
            continue
        if not _age_matches_preference(candidate_age, actor_profile.preferred_min_age, actor_profile.preferred_max_age):
            continue
        if not _age_matches_preference(actor_age, candidate.preferred_min_age, candidate.preferred_max_age):
            continue
        distance = _distance_km(actor_profile, candidate)
        if distance is not None and distance > effective_max_distance:
            continue
        ranked.append((_compatibility_score(actor_profile, candidate, today), candidate))
    ranked.sort(key=lambda pair: (-pair[0], -pair[1].updated_at.timestamp(), str(pair[1].id)))
    return ranked


def ranked_discovery_for(
    actor: NexoraUser,
    *,
    intent: str | None = None,
    education: str | None = None,
    occupation: str | None = None,
    city: str | None = None,
    interest: str | None = None,
    max_distance_km: int | None = None,
):
    return _ranked_candidates_for(
        actor,
        intent=intent,
        education=education,
        occupation=occupation,
        city=city,
        interest=interest,
        max_distance_km=max_distance_km,
    )


def discovery_for(
    actor: NexoraUser,
    limit: int = 20,
    *,
    intent: str | None = None,
    education: str | None = None,
    occupation: str | None = None,
    city: str | None = None,
    interest: str | None = None,
    max_distance_km: int | None = None,
):
    ranked = ranked_discovery_for(
        actor,
        intent=intent,
        education=education,
        occupation=occupation,
        city=city,
        interest=interest,
        max_distance_km=max_distance_km,
    )
    return [candidate for _, candidate in ranked[:limit]]
