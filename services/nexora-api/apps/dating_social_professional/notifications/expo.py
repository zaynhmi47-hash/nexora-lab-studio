import json
import time
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
            delivered = False
            invalid_token = False
            for attempt in range(2):
                try:
                    with urlopen(request, timeout=self.timeout) as response:
                        response_body = json.loads(response.read().decode("utf-8"))
                    ticket = response_body.get("data", {})
                    error = ticket.get("details", {}).get("error") or ticket.get("message")
                    delivered = ticket.get("status") == "ok"
                    invalid_token = error == "DeviceNotRegistered"
                    break
                except HTTPError as exc:
                    if exc.code in (429, 500, 502, 503, 504) and attempt == 0:
                        time.sleep(0.25)
                        continue
                    break
                except (URLError, TimeoutError, ValueError):
                    if attempt == 0:
                        time.sleep(0.25)
                        continue
                    break
            results.append(
                PushDeliveryResult(
                    token=message.token,
                    accepted=delivered,
                    invalid_token=invalid_token,
                )
            )
        return results
