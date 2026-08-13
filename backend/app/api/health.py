from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.api.deps import get_db_session
from app.schemas.health import HealthCheckResponse
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse, summary="API Health & DB Check")
async def health_check(db: AsyncSession = Depends(get_db_session)):
    """Check API server and database connectivity status."""
    db_status = "connected"
    try:
        # Ping database with simple query
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "degraded",
                "app": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "database": db_status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    return HealthCheckResponse(
        status="ok",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        database=db_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
