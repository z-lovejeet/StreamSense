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

import json
import logging
from typing import Annotated
from uuid import UUID

import httpx
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

# ── JWKS cache (for ES256 tokens) ────────────────────────────────
_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    """Fetch and cache JWKS from the Supabase JWKS endpoint."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        logger.info("Fetched JWKS from %s", jwks_url)
        return _jwks_cache


def _decode_token_header(token: str) -> dict:
    """Decode JWT header without verification to check the algorithm."""
    try:
        return jwt.get_unverified_header(token)
    except Exception:
        return {}


async def get_current_user(
    authorization: Annotated[str, Header()],
    session: AsyncSession = Depends(get_session),
) -> User:
    """FastAPI dependency: verify JWT and return the authenticated User.

    Supports both HS256 (legacy) and ES256 (new Supabase) JWT algorithms.

    Steps:
      1. Extract token from ``Authorization: Bearer <token>``.
      2. Decode & verify — auto-detect HS256 vs ES256.
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

    # 2. Decode JWT — support both HS256 and ES256
    header = _decode_token_header(token)
    alg = header.get("alg", "HS256")

    try:
        if alg == "ES256":
            # Asymmetric — use JWKS public key
            jwks = await _get_jwks()
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # Symmetric — use JWT secret (HS256)
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
    except JWTError as exc:
        logger.warning(
            "JWT verification failed (alg=%s): %s | token_prefix=%s...",
            alg, exc, token[:20],
        )
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
