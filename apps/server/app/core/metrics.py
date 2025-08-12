from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, generate_latest

router = APIRouter()

REQUEST_COUNTER = Counter(
    "dokusuite_requests_total",
    "Total HTTP requests",
    ["method", "path", "status_code"],
)

IN_PROGRESS_GAUGE = Gauge(
    "dokusuite_requests_in_progress",
    "In-progress HTTP requests",
    ["path"],
)


@router.get("/metrics")
def metrics() -> Response:
    """Expose Prometheus metrics."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
