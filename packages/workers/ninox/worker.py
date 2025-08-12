from rq import Connection, Worker

from .queue import _redis, queue


def run_worker() -> None:
    """Start a worker to process Ninox sync jobs."""
    with Connection(_redis):
        worker = Worker([queue])
        worker.work()


if __name__ == "__main__":
    run_worker()
