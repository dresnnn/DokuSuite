import logging
import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from .metrics import IN_PROGRESS_GAUGE, REQUEST_COUNTER


class RequestMetricsMiddleware(BaseHTTPMiddleware):
    """Track request metrics and enrich logs."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start_time = time.perf_counter()
        IN_PROGRESS_GAUGE.labels(path=request.url.path).inc()
        try:
            response = await call_next(request)
        finally:
            IN_PROGRESS_GAUGE.labels(path=request.url.path).dec()
        duration_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        REQUEST_COUNTER.labels(
            method=request.method, path=request.url.path, status_code=response.status_code
        ).inc()
        logging.getLogger(__name__).info(
            "request completed",
            extra={
                "request_id": request_id,
                "duration_ms": round(duration_ms, 2),
                "status_code": response.status_code,
            },
        )
        return response
