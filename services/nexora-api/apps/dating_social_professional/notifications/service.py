from django.db import transaction

from ..models import DatingNotification, DatingPushToken
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
