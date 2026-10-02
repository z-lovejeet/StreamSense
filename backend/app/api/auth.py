"""Auth router — user sync and profile endpoints.

Handles OAuth user synchronization with the application database.
The frontend authenticates via Supabase OAuth (Google/GitHub) and
sends the JWT to these endpoints.

REF: DOC-04 Lines 343-351
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.middleware.auth import get_current_user
from app.middleware.errors import UnauthorizedError, ValidationError
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserResponse, UserSyncResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/sync", response_model=UserSyncResponse)
async def sync_user(
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_session),
):
    """Sync OAuth user to application database.

    Called by the frontend after Supabase OAuth sign-in. Creates a new
    user record on first login (default role: volunteer) or updates the
    existing record with latest OAuth metadata.

    Returns the user profile and current role.
    """
    # Verify JWT
    if not authorization.startswith("Bearer "):
        raise UnauthorizedError("Invalid authorization header format")

    token = authorization[7:]
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            from app.middleware.auth import _get_jwks
            jwks = await _get_jwks()
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Token missing subject claim")

    # Extract user metadata from JWT claims
    email = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {})
    full_name = (
        user_metadata.get("full_name")
        or user_metadata.get("name")
        or email.split("@")[0]
    )
    avatar_url = user_metadata.get("avatar_url") or user_metadata.get(
        "picture"
    )

    # Upsert user
    from uuid import UUID

    user_id = UUID(user_id_str)

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        # First-time sign-in — create user with default volunteer role
        user = User(
            id=user_id,
            email=email,
            full_name=full_name,
            role=UserRole.VOLUNTEER,
            avatar_url=avatar_url,
        )
        session.add(user)
        logger.info("New user created: %s (%s)", email, user_id)
    else:
        # Update existing user with latest OAuth metadata
        user.full_name = full_name
        user.avatar_url = avatar_url
        user.email = email
        user.updated_at = datetime.now(timezone.utc)

    await session.commit()
    await session.refresh(user)

    return UserSyncResponse(
        user=UserResponse.model_validate(user),
        role=user.role.value,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user profile."""
    return UserResponse.model_validate(current_user)


class UpdateRoleRequest(BaseModel):
    role: str


@router.post("/role", response_model=UserResponse)
@router.put("/role", response_model=UserResponse)
async def switch_role(
    body: UpdateRoleRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Switch current user role between volunteer and researcher."""
    if body.role not in ("volunteer", "researcher"):
        raise ValidationError(
            f"Invalid role: {body.role}. Must be 'volunteer' or 'researcher'"
        )

    current_user.role = UserRole(body.role)
    current_user.updated_at = datetime.now(timezone.utc)
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return UserResponse.model_validate(current_user)

