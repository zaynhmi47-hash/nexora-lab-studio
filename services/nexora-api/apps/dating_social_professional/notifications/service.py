from django.db import transaction

from ..models import DatingConversationPresence, DatingNotification, DatingNotificationPreference, DatingPushToken
from .expo import ExpoPushProvider
from .ports import PushMessage


class DatingNotificationService:
    @staticmethod
    def create_and_dispatch(
        *,
        recipient_id,
        notification_type: str,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> DatingNotification:
        notification = DatingNotification.objects.create(
            recipient_id=recipient_id,
            type=notification_type,
            title=title,
            body=body,
            data=data or {},
        )
        transaction.on_commit(
            lambda: DatingNotificationService.dispatch(notification_id=notification.id)
        )
        return notification

    @staticmethod
    def dispatch(*, notification_id) -> None:
        notification = DatingNotification.objects.filter(id=notification_id).first()
        if not notification:
            return

        preferences, _ = DatingNotificationPreference.objects.get_or_create(user_id=notification.recipient_id)
        enabled = {
            "match": preferences.match_push_enabled,
            "message": preferences.message_push_enabled,
            "safety": preferences.safety_push_enabled,
        }.get(notification.type, False)
        if not preferences.push_enabled or not enabled:
            return

        if notification.type == "message":
            conversation_id = notification.data.get("conversation_id")
            if conversation_id and DatingConversationPresence.objects.filter(
                user_id=notification.recipient_id,
                conversation_id=conversation_id,
                active=True,
            ).exists():
                return

        tokens = list(
            DatingPushToken.objects.filter(
                user_id=notification.recipient_id,
                active=True,
            ).values_list("token", flat=True)
        )
        if not tokens:
            return

        provider = ExpoPushProvider()
        results = provider.send(
            [
                PushMessage(
                    token=token,
                    title=notification.title,
                    body=notification.body,
                    data={
                        "notificationId": str(notification.id),
                        "type": notification.type,
                        **notification.data,
                    },
                )
                for token in tokens
            ]
        )
        invalid_tokens = [result.token for result in results if result.invalid_token]
        if invalid_tokens:
            DatingPushToken.objects.filter(token__in=invalid_tokens).update(active=False)
