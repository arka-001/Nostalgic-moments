import logging
from datetime import datetime, timezone
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.services.geoip import extract_client_ip
from app.models.blocked_ip import BlockedIP

logger = logging.getLogger(__name__)


class IPBlockerMiddleware(BaseHTTPMiddleware):
    """
    Global IP Shield Security Middleware.
    Enforces active network block rules across all public APIs, audio streaming,
    and background ambience endpoints while permitting admin login, health checks, and docs.
    """

    async def dispatch(self, request: Request, call_next):
        # 1. Allow non-blocking paths:
        # - Preflight CORS OPTIONS
        # - Admin endpoints (/api/analytics/admin/..., /api/admin/..., etc.)
        # - Authentication routes (/api/v1/auth/..., /api/auth/...)
        # - Health probes & OpenAPI documentation
        path = request.url.path
        if (
            request.method == "OPTIONS"
            or "/admin" in path
            or "/auth" in path
            or "/health" in path
            or path.startswith("/docs")
            or path.startswith("/openapi.json")
            or path.startswith("/redoc")
        ):
            return await call_next(request)

        # 2. Extract Client IP
        client_ip = extract_client_ip(request)

        # 3. Query Database for active block rule
        try:
            async with AsyncSessionLocal() as db:
                q = select(BlockedIP).where(
                    BlockedIP.ip_address == client_ip,
                    BlockedIP.is_active == True,
                )
                res = await db.execute(q)
                blocked = res.scalars().first()

                if blocked:
                    # Check if rule has an expiration timestamp
                    if blocked.expires_at and blocked.expires_at < datetime.now(timezone.utc):
                        blocked.is_active = False
                        await db.commit()
                    else:
                        logger.warning(f"🛡️ IP Shield: Blocked request from {client_ip} to {path}")
                        return JSONResponse(
                            status_code=403,
                            content={
                                "detail": "Access to this service has been restricted for your network.",
                                "is_blocked": True,
                                "ip_address": client_ip,
                                "reason": blocked.reason or "Administrator network restriction",
                            },
                        )
        except Exception as err:
            logger.debug(f"IP Shield bypass on DB session error: {err}")

        return await call_next(request)
