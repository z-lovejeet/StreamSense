"""Notification schemas for StreamSense backend.

Defines schemas for in-app user notifications regarding observation review and validation events.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field  # noqa: F401


class NotificationResponse(BaseModel):
    """In-app notification response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    message: str
    observation_id: uuid.UUID | None = None
    read: bool
    created_at: datetime
