import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .ports import PushDeliveryResult, PushMessage


EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send"


class ExpoPushProvider:
    def __init__(self, *, timeout: float = 10.0) -> None:
        self.timeout = timeout

    def send(self, messages: list[PushMessage]) -> list[PushDeliveryResult]:
        results: list[PushDeliveryResult] = []
        for message in messages:
            payload = json.dumps(
                {
                    "to": message.token,
                    "title": message.title,
                    "body": message.body,
                    "data": message.data,
                    "sound": "default",
                }
            ).encode("utf-8")
            request = Request(
                EXPO_PUSH_ENDPOINT,
                data=payload,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    response_body = json.loads(response.read().decode("utf-8"))
                ticket = response_body.get("data", {})
                error = ticket.get("details", {}).get("error") or ticket.get("message")
                results.append(
                    PushDeliveryResult(
                        token=message.token,
                        accepted=ticket.get("status") == "ok",
                        invalid_token=error == "DeviceNotRegistered",
                    )
                )
            except (HTTPError, URLError, TimeoutError, ValueError):
                results.append(PushDeliveryResult(token=message.token, accepted=False))
        return results
