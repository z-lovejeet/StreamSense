"""Observation schemas for StreamSense backend.

Defines request and response schemas for stream observation submissions,
listings, detailed views, and pipeline status tracking.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field

if TYPE_CHECKING:
    from app.schemas.ai_result import AIResultResponse
    from app.schemas.fhir import FHIRResourceResponse
    from app.schemas.review import ReviewResponse


class ObservationCreate(BaseModel):
    """Schema for submitting a new citizen science observation."""

    model_config = ConfigDict(from_attributes=True)

    image_url: str
    description: str | None = Field(default=None, max_length=1000)
    latitude: float
    longitude: float
    timestamp: datetime


class ObservationResponse(BaseModel):
    """Full observation record response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    volunteer_name: str | None = None
    volunteer_email: str | None = None
    volunteer_avatar_url: str | None = None
    image_url: str
    image_thumbnail_url: str | None = None
    description: str | None = None
    latitude: float
    longitude: float
    location_name: str | None = None
    pilot_city: str | None = None
    observed_at: datetime
    status: str
    confidence_score: int | None = None
    routing: str | None = None
    top_species: str | None = None
    top_confidence: float | None = None
    impact_text: str | None = None
    impact_headline: str | None = None
    pipeline_time_seconds: float | None = None
    pipeline_error: str | None = None
    created_at: datetime
    updated_at: datetime


class ObservationListResponse(BaseModel):
    """Paginated list of observations."""

    model_config = ConfigDict(from_attributes=True)

    observations: list[ObservationResponse]
    total: int
    page: int


class ObservationDetailResponse(BaseModel):
    """Detailed observation view including AI results, review, and FHIR resource."""

    model_config = ConfigDict(from_attributes=True)

    observation: ObservationResponse
    ai_results: list[AIResultResponse] = Field(default_factory=list)
    review: ReviewResponse | None = None
    fhir_resource: FHIRResourceResponse | None = None


class AgentStatus(BaseModel):
    """Status of an individual AI agent execution."""

    model_config = ConfigDict(from_attributes=True)

    agent: str
    status: str


class ObservationStatusResponse(BaseModel):
    """Pipeline execution status response for an observation."""

    model_config = ConfigDict(from_attributes=True)

    status: str
    agent_statuses: list[AgentStatus]
