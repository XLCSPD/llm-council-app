"""API router aggregation."""

from fastapi import APIRouter

from app.api.endpoints import councils, models, sessions

api_router = APIRouter()

api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(councils.router, prefix="/councils", tags=["councils"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
