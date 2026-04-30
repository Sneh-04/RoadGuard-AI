"""API routes package - modular route organization."""
from .auth import router as auth_router
from .admin import router as admin_router
from .health import router as health_router
from .predictions import router as predictions_router
from .events import router as events_router

__all__ = [
    "auth_router",
    "admin_router",
    "health_router",
    "predictions_router",
    "events_router",
]
