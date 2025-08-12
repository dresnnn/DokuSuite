from fastapi import FastAPI

from .api.routes import health as health_routes
from .core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    app.include_router(health_routes.router)
    return app


app = create_app()
