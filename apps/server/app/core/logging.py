import json
import logging
from typing import Any


class JsonFormatter(logging.Formatter):
    """Format log records as JSON."""

    def format(self, record: logging.LogRecord) -> str:
        log_record: dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
        }
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id
        if hasattr(record, "duration_ms"):
            log_record["duration_ms"] = record.duration_ms
        if hasattr(record, "status_code"):
            log_record["status_code"] = record.status_code
        return json.dumps(log_record)


def configure_logging() -> None:
    """Configure root logger to use JSON formatting."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(logging.INFO)
