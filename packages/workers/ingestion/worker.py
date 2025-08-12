from rq import Connection, Worker

from .queue import queue, _redis


def run_worker() -> None:
    """Start a worker to process ingestion jobs."""
    with Connection(_redis):
        worker = Worker([queue])
        worker.work()


if __name__ == "__main__":
    run_worker()
