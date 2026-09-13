from __future__ import annotations

from django.http import HttpRequest, HttpResponse

from apps.core.middleware.context import RequestContext, reset_request_context, set_request_context
from apps.core.utilities.ids import generate_correlation_id, validate_correlation_id


class RequestCorrelationMiddleware:
    request_header = "HTTP_X_CORRELATION_ID"
    response_header = "X-Correlation-ID"
    legacy_request_header = "HTTP_X_REQUEST_ID"
    legacy_response_header = "X-Request-ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        incoming_id = request.META.get(self.request_header)
        if not validate_correlation_id(incoming_id or ""):
            incoming_id = request.META.get(self.legacy_request_header)
        correlation_id = incoming_id if validate_correlation_id(incoming_id or "") else generate_correlation_id()
        request.correlation_id = correlation_id
        request.request_id = correlation_id
        token = set_request_context(RequestContext(correlation_id=correlation_id))
        try:
            response = self.get_response(request)
        finally:
            reset_request_context(token)
        response[self.response_header] = correlation_id
        response[self.legacy_response_header] = correlation_id
        return response
