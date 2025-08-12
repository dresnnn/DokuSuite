from fastapi import FastAPI

from .api.routes import auth as auth_routes
from .api.routes import exports as export_routes
from .api.routes import health as health_routes
from .api.routes import ingestion as ingestion_routes
from .api.routes import locations as location_routes
from .api.routes import orders as order_routes
from .api.routes import photos as photo_routes
from .core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    app.include_router(health_routes.router)
    app.include_router(ingestion_routes.router)
    app.include_router(auth_routes.router)
    app.include_router(location_routes.router)
    app.include_router(photo_routes.router)
    app.include_router(order_routes.router)
    app.include_router(export_routes.router)
    return app


app = create_app()
