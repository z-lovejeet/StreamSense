"""Expert review schemas for StreamSense backend.

Defines request and response schemas for researcher validation, corrections, and rejection decisions.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    """Schema for submitting an expert review decision."""

    model_config = ConfigDict(from_attributes=True)

    action: str
    corrections: dict[str, Any] | None = None
    rejection_reason: str | None = Field(default=None, max_length=500)
    review_notes: str | None = None
    review_time_seconds: int | None = None


class ReviewResponse(BaseModel):
    """Schema for returning an expert review record."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    observation_id: uuid.UUID
    reviewer_id: uuid.UUID
    action: str
    corrections: dict[str, Any] | None = None
    rejection_reason: str | None = None
    review_notes: str | None = None
    review_time_seconds: int | None = None
    created_at: datetime
