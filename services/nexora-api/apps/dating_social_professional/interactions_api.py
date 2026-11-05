from datetime import date

from django.db import IntegrityError
from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.models import NexoraUser

from .api import DatingActionThrottle, DatingActiveUserPermission
from .models import DatingBlock, DatingMoment, DatingMomentComment, DatingMomentReaction, DatingNotification, DatingProfile, DatingReport
from .services import DatingSafetyService


def _visible_moment(request, moment_id):
    moment = DatingMoment.objects.select_related("author", "author__dating_profile").filter(
        id=moment_id, deleted_at__isnull=True, author__status=NexoraUser.Status.ACTIVE,
    ).first()
    if not moment:
        return None
    if moment.author_id != request.user.id and moment.visibility != DatingMoment.Visibility.PUBLIC:
        return None
    if DatingBlock.objects.filter(
        Q(blocker_id=request.user.id, blocked_id=moment.author_id)
        | Q(blocker_id=moment.author_id, blocked_id=request.user.id)
    ).exists():
        return None
    if moment.author_id != request.user.id and not getattr(moment.author, "dating_profile", None):
        return None
    return moment


def _adult_profile(user):
    profile = DatingProfile.objects.filter(user=user).first()
    if not profile or not profile.birth_date:
        return False
    today = date.today()
    age = today.year - profile.birth_date.year - ((today.month, today.day) < (profile.birth_date.month, profile.birth_date.day))
    return age >= 18


def _notify_moment_author(moment, actor, action, comment_id=None):
    if moment.author_id == actor.id:
        return
    actor_profile = DatingProfile.objects.filter(user=actor).first()
    actor_name = actor_profile.display_name if actor_profile else actor.display_name
    body = f"{actor_name} menyukai Moment Anda." if action == "like" else f"{actor_name} mengomentari Moment Anda."
    data = {"momentId": str(moment.id), "actorId": str(actor.id), "action": action}
    if comment_id:
        data["commentId"] = str(comment_id)
    DatingNotification.objects.create(
        recipient=moment.author,
        type=DatingNotification.Type.SOCIAL,
        title="Aktivitas Moment",
        body=body[:500],
        data=data,
    )


class DatingMomentReactionView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def post(self, request, moment_id):
        moment = _visible_moment(request, moment_id)
        if not moment:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _adult_profile(request.user):
            return Response({"detail": "A verified adult dating profile is required."}, status=status.HTTP_403_FORBIDDEN)
        reaction = DatingMomentReaction.objects.filter(moment=moment, user=request.user, deleted_at__isnull=True).first()
        if reaction:
            return Response({"status": "liked", "reaction_id": str(reaction.id)})
        try:
            reaction = DatingMomentReaction.objects.create(moment=moment, user=request.user)
        except IntegrityError:
            reaction = DatingMomentReaction.objects.filter(moment=moment, user=request.user, deleted_at__isnull=True).first()
            if not reaction:
                raise
            return Response({"status": "liked", "reaction_id": str(reaction.id)})
        _notify_moment_author(moment, request.user, "like")
        return Response({"status": "liked", "reaction_id": str(reaction.id)}, status=status.HTTP_201_CREATED)

    def delete(self, request, moment_id):
        moment = _visible_moment(request, moment_id)
        if not moment:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)
        reaction = DatingMomentReaction.objects.filter(moment=moment, user=request.user, deleted_at__isnull=True).first()
        if reaction:
            reaction.soft_delete()
        return Response({"status": "unliked"})


class DatingMomentCommentInputSerializer(serializers.ModelSerializer):
    parent_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = DatingMomentComment
        fields = ("body", "parent_id")

    def validate_body(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Comment cannot be empty.")
        return value


class DatingMomentCommentsView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def get(self, request, moment_id):
        moment = _visible_moment(request, moment_id)
        if not moment:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            limit = min(50, max(1, int(request.query_params.get("limit", "30"))))
        except (TypeError, ValueError):
            return Response({"detail": "limit must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        comments = DatingMomentComment.objects.filter(
            moment=moment, parent__isnull=True, deleted_at__isnull=True,
            author__status=NexoraUser.Status.ACTIVE,
        ).select_related("author").order_by("created_at")[:limit]
        items = []
        for comment in comments:
            profile = getattr(comment.author, "dating_profile", None)
            replies = DatingMomentComment.objects.filter(
                parent=comment, deleted_at__isnull=True, author__status=NexoraUser.Status.ACTIVE,
            ).select_related("author").order_by("created_at")[:20]
            items.append({
                "id": str(comment.id),
                "author": {"id": str(comment.author_id), "display_name": profile.display_name if profile else comment.author.display_name},
                "body": comment.body,
                "created_at": comment.created_at.isoformat(),
                "is_own": comment.author_id == request.user.id,
                "replies": [{
                    "id": str(reply.id),
                    "author": {"id": str(reply.author_id), "display_name": getattr(getattr(reply.author, "dating_profile", None), "display_name", reply.author.display_name)},
                    "body": reply.body,
                    "created_at": reply.created_at.isoformat(),
                    "is_own": reply.author_id == request.user.id,
                } for reply in replies],
            })
        return Response({"items": items})

    def post(self, request, moment_id):
        moment = _visible_moment(request, moment_id)
        if not moment:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _adult_profile(request.user):
            return Response({"detail": "A verified adult dating profile is required."}, status=status.HTTP_403_FORBIDDEN)
        serializer = DatingMomentCommentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parent_id = serializer.validated_data.pop("parent_id", None)
        parent = None
        if parent_id:
            parent = DatingMomentComment.objects.filter(
                id=parent_id, moment=moment, parent__isnull=True, deleted_at__isnull=True,
            ).first()
            if not parent:
                return Response({"detail": "Parent comment not found for this moment."}, status=status.HTTP_400_BAD_REQUEST)
        comment = DatingMomentComment.objects.create(
            moment=moment, author=request.user, parent=parent, body=serializer.validated_data["body"],
        )
        _notify_moment_author(moment, request.user, "comment", comment.id)
        return Response({
            "id": str(comment.id), "moment_id": str(moment.id),
            "parent_id": str(parent.id) if parent else None,
            "body": comment.body, "created_at": comment.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)

    def delete(self, request, moment_id):
        moment = _visible_moment(request, moment_id)
        if not moment:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)
        comment_id = request.query_params.get("comment_id")
        if not comment_id:
            return Response({"detail": "comment_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        comment = DatingMomentComment.objects.filter(
            id=comment_id, moment=moment, author=request.user, deleted_at__isnull=True,
        ).first()
        if not comment:
            return Response({"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)
        comment.soft_delete()
        return Response({"status": "deleted"})


class DatingMomentReportInputSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(choices=DatingReport.Reason.choices)
    details = serializers.CharField(max_length=2000, required=False, allow_blank=True)


class DatingMomentReportView(APIView):
    permission_classes = [DatingActiveUserPermission]
    throttle_classes = [DatingActionThrottle]

    def post(self, request, moment_id):
        moment = _visible_moment(request, moment_id)
        if not moment or moment.author_id == request.user.id:
            return Response({"detail": "Moment not found."}, status=status.HTTP_404_NOT_FOUND)
        if not _adult_profile(request.user):
            return Response({"detail": "A verified adult dating profile is required."}, status=status.HTTP_403_FORBIDDEN)
        serializer = DatingMomentReportInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        details = serializer.validated_data.get("details", "").strip()
        report_details = f"[moment:{moment.id}] {details}".strip()
        try:
            report = DatingSafetyService.report(
                actor=request.user, target=moment.author,
                reason=serializer.validated_data["reason"], details=report_details[:2000],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "reported", "report_id": str(report.id)}, status=status.HTTP_201_CREATED)
