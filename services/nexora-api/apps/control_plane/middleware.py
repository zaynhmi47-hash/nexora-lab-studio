from time import monotonic

from .telemetry import record_request


class RequestTelemetryMiddleware:
    """Local development telemetry; bounded in-memory and never stores request bodies."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        started = monotonic()
        try:
            response = self.get_response(request)
        except Exception:
            duration_ms = (monotonic() - started) * 1000
            record_request(
                method=request.method,
                path=request.path,
                status_code=500,
                duration_ms=duration_ms,
            )
            raise

        record_request(
            method=request.method,
            path=request.path,
            status_code=response.status_code,
            duration_ms=(monotonic() - started) * 1000,
        )
        return response
