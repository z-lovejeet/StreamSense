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
