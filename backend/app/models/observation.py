"""Observation model — primary entity submitted by volunteers.

Each observation represents one citizen science stream photo submission.
It progresses through the AI pipeline (status: processing → auto_validated / pending_review)
and accumulates denormalized results from the 7 AI agents.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Enum, Float, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

from app.database import Base
from app.models.enums import ObservationStatus


class Observation(Base):
    """Volunteer stream observation with AI pipeline results."""

    __tablename__ = "observations"
    __table_args__ = (
        Index("idx_observations_user_id", "user_id"),
        Index("idx_observations_status", "status"),
        Index("idx_observations_created_at", "created_at"),
        Index("idx_observations_pilot_city", "pilot_city"),
        Index("idx_observations_confidence", "confidence_score"),
        Index("idx_observations_top_species", "top_species"),
        Index("idx_observations_status_created", "status", "created_at"),
        Index(
            "idx_observations_review_queue",
            "status",
            "created_at",
        ),
        Index("idx_observations_user_history", "user_id", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    image_url = Column(Text, nullable=False)
    image_thumbnail_url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    pilot_city = Column(String(100), nullable=True)
    observed_at = Column(TIMESTAMP(timezone=True), nullable=False)
    status = Column(
        Enum(ObservationStatus, name="observation_status"),
        nullable=False,
        default=ObservationStatus.PROCESSING,
    )
    confidence_score = Column(Integer, nullable=True)
    routing = Column(String(50), nullable=True)
    top_species = Column(String(255), nullable=True)
    top_confidence = Column(Float, nullable=True)
    impact_text = Column(Text, nullable=True)
    impact_headline = Column(String(255), nullable=True)
    pipeline_time_seconds = Column(Float, nullable=True)
    pipeline_error = Column(Text, nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="observations")
    ai_results = relationship(
        "AIResult", back_populates="observation", cascade="all, delete-orphan"
    )
    review = relationship(
        "ExpertReview", back_populates="observation", uselist=False
    )
    fhir_resource = relationship(
        "FHIRResource", back_populates="observation", uselist=False
    )
    notifications = relationship("Notification", back_populates="observation")
