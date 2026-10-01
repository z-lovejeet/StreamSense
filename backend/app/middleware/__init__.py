"""StreamSense middleware — auth + error handling."""

from app.middleware.auth import get_current_user, require_role
from app.middleware.errors import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    RateLimitedError,
    ServiceUnavailableError,
    StreamSenseError,
    UnauthorizedError,
    ValidationError,
    register_exception_handlers,
)

__all__ = [
    "get_current_user",
    "require_role",
    "ConflictError",
    "ForbiddenError",
    "NotFoundError",
    "RateLimitedError",
    "ServiceUnavailableError",
    "StreamSenseError",
    "UnauthorizedError",
    "ValidationError",
    "register_exception_handlers",
]
