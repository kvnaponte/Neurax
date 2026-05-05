"""
Rutas de la API para el Sistema Imbatible
"""
from .users import router as users_router
from .activities import router as activities_router
from .stats import router as stats_router
from .auth import router as auth_router

__all__ = ["users_router", "activities_router", "stats_router", "auth_router"]