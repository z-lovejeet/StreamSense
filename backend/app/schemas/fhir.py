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

    # Linked observation details
    top_species: str | None = None
    location_name: str | None = None
    pilot_city: str | None = None
    image_url: str | None = None
    image_thumbnail_url: str | None = None
    confidence_score: int | None = None
    volunteer_name: str | None = None
    observed_at: datetime | None = None
    observation_status: str | None = None
    bmwp_score: int | None = None
    water_quality_indication: str | None = None

