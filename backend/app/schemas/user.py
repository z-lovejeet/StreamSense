"""User schemas for StreamSense backend.

Defines request and response schemas for user profiles and authentication synchronization.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field  # noqa: F401


class UserResponse(BaseModel):
    """User profile response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: str
    avatar_url: str | None = None
    city: str | None = None
    created_at: datetime
    updated_at: datetime


class UserSyncResponse(BaseModel):
    """Response returned upon syncing user authentication state."""

    model_config = ConfigDict(from_attributes=True)

    user: UserResponse
    role: str
