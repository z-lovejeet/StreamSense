"""FHIRResource model — stores generated FHIR R4 resources.

Tracks the full lifecycle from generation → validation → sandbox POST.
Each observation can produce one FHIR Observation resource (1-to-1 via uselist=False).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class FHIRResource(Base):
    """FHIR R4 resource generated from a validated observation."""

    __tablename__ = "fhir_resources"
    __table_args__ = (
        Index("idx_fhir_observation", "observation_id"),
        Index("idx_fhir_sandbox_status", "sandbox_status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id = Column(
        UUID(as_uuid=True), ForeignKey("observations.id"), nullable=False
    )
    resource_type = Column(String(100), nullable=False, default="Observation")
    profile_url = Column(Text, nullable=False)
    resource_json = Column(JSONB, nullable=False)
    validation_status = Column(String(50), nullable=False)
    validation_errors = Column(JSONB, nullable=True)
    sandbox_status = Column(String(50), nullable=False, default="pending")
    sandbox_id = Column(String(255), nullable=True)
    sandbox_response = Column(JSONB, nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    posted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    observation = relationship("Observation", back_populates="fhir_resource")

    @property
    def top_species(self) -> str | None:
        try:
            return self.observation.top_species if self.observation else None
        except Exception:
            return None

    @property
    def location_name(self) -> str | None:
        try:
            return self.observation.location_name if self.observation else None
        except Exception:
            return None

    @property
    def pilot_city(self) -> str | None:
        try:
            return self.observation.pilot_city if self.observation else None
        except Exception:
            return None

    @property
    def image_url(self) -> str | None:
        try:
            return self.observation.image_url if self.observation else None
        except Exception:
            return None

    @property
    def image_thumbnail_url(self) -> str | None:
        try:
            if self.observation:
                return self.observation.image_thumbnail_url or self.observation.image_url
            return None
        except Exception:
            return None

    @property
    def confidence_score(self) -> int | None:
        try:
            return self.observation.confidence_score if self.observation else None
        except Exception:
            return None

    @property
    def volunteer_name(self) -> str | None:
        try:
            return self.observation.volunteer_name if self.observation else None
        except Exception:
            return None

    @property
    def observed_at(self) -> datetime | None:
        try:
            return self.observation.observed_at if self.observation else None
        except Exception:
            return None

    @property
    def observation_status(self) -> str | None:
        try:
            if self.observation and self.observation.status:
                return (
                    self.observation.status.value
                    if hasattr(self.observation.status, "value")
                    else str(self.observation.status)
                )
            return None
        except Exception:
            return None

    @property
    def bmwp_score(self) -> int | None:
        try:
            if not self.resource_json or not isinstance(self.resource_json, dict):
                return None
            comps = self.resource_json.get("component", [])
            for c in comps:
                codes = [
                    item.get("code")
                    for item in c.get("code", {}).get("coding", [])
                    if isinstance(item, dict)
                ]
                if "bmwp-score" in codes:
                    vq = c.get("valueQuantity", {})
                    if "value" in vq:
                        return int(vq["value"])
            return None
        except Exception:
            return None

    @property
    def water_quality_indication(self) -> str | None:
        try:
            if not self.resource_json or not isinstance(self.resource_json, dict):
                return None
            comps = self.resource_json.get("component", [])
            for c in comps:
                codes = [
                    item.get("code")
                    for item in c.get("code", {}).get("coding", [])
                    if isinstance(item, dict)
                ]
                if "water-quality-indication" in codes:
                    return c.get("valueString")
            return None
        except Exception:
            return None

