# FILE: routers/health.py
# Health check endpoints
# Pre-existing - update as needed

from fastapi import APIRouter, Response

router = APIRouter()


@router.get("/")
async def health_check(response: Response = None):
    """Health check endpoint"""
    response.headers["Cache-Control"] = "no-store"
    return {
        "status": "ok",
        "service": "phishslayer-api",
        "version": "1.0.0"
    }
