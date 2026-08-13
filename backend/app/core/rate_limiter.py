"""
Rate Limiter Middleware for FastAPI
Implements sliding-window rate limiting to protect auth, uploads, and admin endpoints.
"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SlidingWindowRateLimiter:
    """In-memory sliding window rate limiter per IP address."""

    def __init__(self):
        # Maps (ip, route_category) -> list of request timestamps (seconds)
        self.requests: Dict[Tuple[str, str], List[float]] = defaultdict(list)

    def is_allowed(
        self, client_ip: str, category: str, max_requests: int, window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Check if request from client_ip for category is allowed.
        Returns: (allowed: bool, remaining_requests: int, retry_after: int)
        """
        now = time.time()
        window_start = now - window_seconds
        key = (client_ip, category)

        # Remove timestamps outside the sliding window
        self.requests[key] = [ts for ts in self.requests[key] if ts > window_start]

        current_count = len(self.requests[key])
        if current_count >= max_requests:
            oldest_ts = self.requests[key][0]
            retry_after = int(window_seconds - (now - oldest_ts)) + 1
            return False, 0, max(1, retry_after)

        # Record current timestamp
        self.requests[key].append(now)
        remaining = max_requests - (current_count + 1)
        return True, remaining, 0


# Global Rate Limiter instance
rate_limiter = SlidingWindowRateLimiter()


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """FastAPI Middleware enforcing endpoint-specific rate limits."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract client IP (handles X-Forwarded-For if behind proxy)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        path = request.url.path
        method = request.method.upper()

        # Define category and rate limits: (max_requests, window_seconds)
        if path.endswith("/auth/login") and method == "POST":
            category = "auth_login"
            limit, window = 5, 60  # Max 5 login attempts per minute
        elif "/admin/uploads" in path:
            category = "admin_uploads"
            limit, window = 15, 60  # Max 15 uploads per minute
        elif "/admin" in path and method in ("POST", "PUT", "PATCH", "DELETE"):
            category = "admin_mutations"
            limit, window = 30, 60  # Max 30 mutations per minute
        elif path.startswith("/api/"):
            category = "api_general"
            limit, window = 120, 60  # Max 120 general API calls per minute
        else:
            # Skip rate limiting for static files / root
            return await call_next(request)

        allowed, remaining, retry_after = rate_limiter.is_allowed(
            client_ip, category, limit, window
        )

        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Rate limit exceeded.",
                    "category": category,
                    "retry_after_seconds": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
