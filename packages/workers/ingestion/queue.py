import os
from typing import Any

from redis import Redis
from rq import Queue

from . import jobs

_redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
_redis = Redis.from_url(_redis_url)
queue = Queue("ingestion", connection=_redis)


def enqueue_ingest(payload: dict[str, Any]) -> Any:
    """Enqueue an ingestion job."""
    return queue.enqueue(jobs.ingest, payload)
