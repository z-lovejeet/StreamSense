"""ExpertReview model — records researcher review decisions.

One review per observation (1-to-1 via UNIQUE constraint on observation_id).
Researchers can confirm, correct, or reject observations routed to pending_review.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ReviewAction


class ExpertReview(Base):
    """Expert researcher review of a low-confidence observation."""

    __tablename__ = "expert_reviews"
    __table_args__ = (
        Index("idx_reviews_observation", "observation_id"),
        Index("idx_reviews_reviewer", "reviewer_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("observations.id"),
        unique=True,
        nullable=False,
    )
    reviewer_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    action = Column(
        Enum(ReviewAction, name="review_action"),
        nullable=False,
    )
    corrections = Column(JSONB, nullable=True)
    rejection_reason = Column(String(500), nullable=True)
    review_notes = Column(Text, nullable=True)
    review_time_seconds = Column(Integer, nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    observation = relationship("Observation", back_populates="review")
    reviewer = relationship("User", back_populates="reviews")
