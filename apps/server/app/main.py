from fastapi import FastAPI

from .api.routes import auth as auth_routes
from .api.routes import exports as export_routes
from .api.routes import health as health_routes
from .api.routes import ingestion as ingestion_routes
from .api.routes import locations as location_routes
from .api.routes import orders as order_routes
from .api.routes import photos as photo_routes
from .api.routes import shares as share_routes
from .core.config import settings
from .core.logging import configure_logging
from .core.metrics import router as metrics_router
from .core.middleware import RequestMetricsMiddleware

try:  # optional OpenTelemetry
    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
except Exception:  # pragma: no cover - optional dependency
    FastAPIInstrumentor = None


def configure_tracing(app: FastAPI) -> None:
    if not FastAPIInstrumentor or not settings.tracing_exporter:
        return
    if settings.tracing_exporter == "otlp":
        exporter = OTLPSpanExporter(endpoint=settings.tracing_endpoint)
    else:
        return
    resource = Resource.create({"service.name": settings.app_name})
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app)


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title=settings.app_name)
    app.add_middleware(RequestMetricsMiddleware)
    app.include_router(metrics_router)
    app.include_router(health_routes.router)
    app.include_router(ingestion_routes.router)
    app.include_router(auth_routes.router)
    app.include_router(location_routes.router)
    app.include_router(photo_routes.router)
    app.include_router(order_routes.router)
    app.include_router(share_routes.router)
    app.include_router(share_routes.public_router)
    app.include_router(export_routes.router)
    configure_tracing(app)
    return app


app = create_app()
