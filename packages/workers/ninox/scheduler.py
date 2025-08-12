import time

from .queue import enqueue_ninox_sync


def run_scheduler(interval_seconds: int = 3600) -> None:
    """Periodically enqueue Ninox sync jobs."""
    while True:  # pragma: no cover - long running
        enqueue_ninox_sync()
        time.sleep(interval_seconds)


if __name__ == "__main__":
    run_scheduler()
