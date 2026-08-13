import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.rate_limiter import RateLimiterMiddleware
from app.core.security_headers import SecurityHeadersMiddleware

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.songs import router as songs_router
from app.api.uploads import router as uploads_router
from app.api.analytics import router as analytics_router

from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base
from app.db.init_db import init_db

# Import models so SQLAlchemy metadata registers all tables
import app.models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events."""
    logger.info("Starting up Nostalgic Music Platform Backend...")

    try:
        # Ensure tables exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Seed database
        async with AsyncSessionLocal() as session:
            await init_db(session)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization warning on startup (will retry on requests): {e}")

    yield

    logger.info("Shutting down Nostalgic Music Platform Backend...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# 1. Rate Limiting Middleware (Brute-force & Anti-abuse protection)
app.add_middleware(RateLimiterMiddleware)

# 2. HTTP Security Headers Middleware (XSS, Clickjacking, Sniffing hardening)
app.add_middleware(SecurityHeadersMiddleware)

# 3. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory if needed for local fallback
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API Routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(categories_router, prefix=settings.API_V1_STR, tags=["Categories"])
app.include_router(songs_router, prefix=settings.API_V1_STR, tags=["Songs"])
app.include_router(uploads_router, prefix=f"{settings.API_V1_STR}/admin", tags=["Uploads"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])



@app.get("/")
async def root():
    return {
        "message": "Welcome to Nostalgic Music Experience Platform API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health",
        "security": "Rate Limiting & Security Headers Enabled",
        "storage": "Supabase Storage Enabled" if settings.SUPABASE_SERVICE_ROLE_KEY else "Local Fallback",
    }
