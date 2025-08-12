import os
from typing import Any

from redis import Redis
from rq import Queue

from . import jobs

_redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
_redis = Redis.from_url(_redis_url)
queue = Queue("ninox", connection=_redis)


def enqueue_ninox_sync(payload: dict[str, Any] | None = None) -> Any:
    """Enqueue a Ninox sync job."""
    return queue.enqueue(jobs.sync_ninox, payload)
