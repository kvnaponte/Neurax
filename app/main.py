"""
Sistema Imbatible - FastAPI Application Entry Point

RPG de la vida real para optimizar comportamiento y productividad.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    APP_TITLE,
    APP_DESCRIPTION,
    APP_VERSION,
    CORS_ORIGINS,
    CORS_ALLOW_CREDENTIALS,
    CORS_ALLOW_METHODS,
    CORS_ALLOW_HEADERS,
)
from app.database import init_db
from app.routes import users_router, activities_router, stats_router, auth_router


# Create FastAPI application
app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION
)

# Initialize database tables
init_db()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(activities_router)
app.include_router(stats_router)


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    """Root endpoint - API status"""
    return {"mensaje": "Sistema Imbatible activo", "version": APP_VERSION}


@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok"}