"""FHIR resource schemas for StreamSense backend.

Defines response schemas for generated FHIR R4 resources and sandbox posting status.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field  # noqa: F401


class FHIRResourceResponse(BaseModel):
    """FHIR R4 resource response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    observation_id: uuid.UUID
    resource_type: str
    profile_url: str
    resource_json: dict[str, Any]
    validation_status: str
    sandbox_status: str
    sandbox_id: str | None = None
    created_at: datetime
    posted_at: datetime | None = None
