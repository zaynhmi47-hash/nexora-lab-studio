import logging

from apps.core.context import get_request_context


class CorrelationIDFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.correlation_id = get_request_context().correlation_id or "-"
        return True
