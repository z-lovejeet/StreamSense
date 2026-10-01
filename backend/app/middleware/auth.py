"""StreamSense auth middleware — Supabase JWT verification + RBAC.

Provides two FastAPI dependencies:

- ``get_current_user`` — verifies the ``Authorization: Bearer <JWT>``
  header, decodes the Supabase JWT, looks up (or creates) the user in
  the database, and returns the ``User`` ORM instance.

- ``require_role(*roles)`` — wraps ``get_current_user`` and additionally
  checks that the user's role is in the allowed set.

REF: DOC-04 Lines 419-481
"""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.middleware.errors import ForbiddenError, UnauthorizedError
from app.models.enums import UserRole
from app.models.user import User

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Annotated[str, Header()],
    session: AsyncSession = Depends(get_session),
) -> User:
    """FastAPI dependency: verify JWT and return the authenticated User.

    Steps:
      1. Extract token from ``Authorization: Bearer <token>``.
      2. Decode & verify via Supabase JWT secret (HS256).
      3. Extract ``sub`` claim (Supabase auth user UUID).
      4. Look up user in the database.
      5. If not found → 401 (user must call ``POST /auth/sync`` first).

    Raises:
        UnauthorizedError: Missing, malformed, or expired token; or user
            not in database.
    """
    # 1. Extract token
    if not authorization.startswith("Bearer "):
        raise UnauthorizedError("Invalid authorization header format")

    token = authorization[7:]
    if not token:
        raise UnauthorizedError("Missing authentication token")

    # 2. Decode JWT
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as exc:
        logger.debug("JWT verification failed: %s", exc)
        raise UnauthorizedError("Invalid or expired token")

    # 3. Extract user ID
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Token missing subject claim")

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise UnauthorizedError("Invalid user ID in token")

    # 4. Database lookup
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise UnauthorizedError(
            "User not found — call POST /auth/sync first"
        )

    return user


def require_role(*allowed_roles: str):
    """Factory returning a FastAPI dependency that checks user role.

    Usage::

        @router.get("/review/queue")
        async def get_queue(
            user: User = Depends(require_role("researcher")),
        ): ...
    """

    async def _check_role(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role.value not in allowed_roles:
            raise ForbiddenError(
                f"This endpoint requires one of: {', '.join(allowed_roles)}"
            )
        return current_user

    return _check_role
