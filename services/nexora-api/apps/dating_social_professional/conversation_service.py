from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.identity.models import NexoraUser

from .models import DatingBlock, DatingConversation, DatingMatch, DatingMessage
from .notifications.service import DatingNotificationService


class DatingConversationService:
    @staticmethod
    @transaction.atomic
    def get_or_create_for_user(*, actor: NexoraUser, match_id) -> DatingConversation:
        match = DatingMatch.objects.select_for_update().filter(id=match_id, active=True).first()
        if not match or actor.id not in {match.user_a_id, match.user_b_id}:
            raise ValueError("Active match not found.")
        if match.user_a.status != NexoraUser.Status.ACTIVE or match.user_b.status != NexoraUser.Status.ACTIVE:
            raise ValueError("Active match not found.")
        if DatingBlock.objects.filter(
            Q(blocker_id=match.user_a_id, blocked_id=match.user_b_id)
            | Q(blocker_id=match.user_b_id, blocked_id=match.user_a_id)
        ).exists():
            raise ValueError("This conversation is unavailable.")
        conversation, _ = DatingConversation.objects.get_or_create(match=match)
        return conversation

    @staticmethod
    @transaction.atomic
    def send(*, actor: NexoraUser, conversation_id, body: str) -> DatingMessage:
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation:
            raise ValueError("Conversation not found.")
        match = conversation.match
        if (
            not match.active
            or match.user_a.status != NexoraUser.Status.ACTIVE
            or match.user_b.status != NexoraUser.Status.ACTIVE
            or actor.id not in {match.user_a_id, match.user_b_id}
        ):
            raise ValueError("Conversation is unavailable.")
        if DatingBlock.objects.filter(
            Q(blocker_id=match.user_a_id, blocked_id=match.user_b_id)
            | Q(blocker_id=match.user_b_id, blocked_id=match.user_a_id)
        ).exists():
            raise ValueError("Messaging is unavailable.")
        normalized = body.strip()
        if not normalized:
            raise ValueError("Message body cannot be empty.")
        message = DatingMessage.objects.create(conversation=conversation, sender=actor, body=normalized)
        recipient_id = match.user_b_id if actor.id == match.user_a_id else match.user_a_id
        DatingNotificationService.create_and_dispatch(
            recipient_id=recipient_id,
            notification_type="message",
            title="New message",
            body=normalized[:500],
            data={"conversation_id": str(conversation.id), "message_id": str(message.id)},
        )
        return message

    @staticmethod
    @transaction.atomic
    def mark_read(*, actor: NexoraUser, conversation_id) -> int:
        conversation = DatingConversation.objects.select_related("match").filter(id=conversation_id, active=True).first()
        if not conversation or actor.id not in {conversation.match.user_a_id, conversation.match.user_b_id}:
            raise ValueError("Conversation not found.")
        return DatingMessage.objects.filter(conversation=conversation, read_at__isnull=True).exclude(sender=actor).update(read_at=timezone.now())
