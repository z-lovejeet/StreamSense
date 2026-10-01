"""StreamSense error types and global exception handlers.

All API errors inherit from ``StreamSenseError`` and are rendered by the
global handler into the standard JSON envelope:

    {"error": {"code": "...", "message": "...", "details": [...]}}

REF: DOC-04 Lines 580-604
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


# ── Base exception ───────────────────────────────────────────────


class StreamSenseError(Exception):
    """Base exception for all StreamSense API errors."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or []


# ── Concrete error types ─────────────────────────────────────────


class UnauthorizedError(StreamSenseError):
    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(message, code="UNAUTHORIZED", status_code=401)


class ForbiddenError(StreamSenseError):
    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(message, code="FORBIDDEN", status_code=403)


class NotFoundError(StreamSenseError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, code="NOT_FOUND", status_code=404)


class ConflictError(StreamSenseError):
    def __init__(self, message: str = "Resource conflict") -> None:
        super().__init__(message, code="CONFLICT", status_code=409)


class RateLimitedError(StreamSenseError):
    def __init__(self, message: str = "Rate limit exceeded") -> None:
        super().__init__(message, code="RATE_LIMITED", status_code=429)


class ServiceUnavailableError(StreamSenseError):
    def __init__(self, message: str = "Service temporarily unavailable") -> None:
        super().__init__(message, code="SERVICE_UNAVAILABLE", status_code=503)


class ValidationError(StreamSenseError):
    def __init__(
        self,
        message: str = "Validation error",
        details: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(
            message, code="VALIDATION_ERROR", status_code=400, details=details
        )


# ── Exception handlers ──────────────────────────────────────────


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""

    @app.exception_handler(StreamSenseError)
    async def _streamsense_error(request: Request, exc: StreamSenseError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError):
        details = [
            {
                "field": ".".join(str(loc) for loc in err.get("loc", [])),
                "issue": err.get("msg", "Invalid value"),
            }
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": details,
                }
            },
        )

    @app.exception_handler(Exception)
    async def _generic_error(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "details": [],
                }
            },
        )
