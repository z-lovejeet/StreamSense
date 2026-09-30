"""AIResult model — stores raw output of each AI agent per observation.

One row per agent per observation (typically 5-7 rows per observation).
The `result` JSONB column contains the full agent output whose structure
varies by agent_name (vision, description, metadata, quality, fhir, impact, expert_brief).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AIResult(Base):
    """Individual AI agent output for a given observation."""

    __tablename__ = "ai_results"
    __table_args__ = (
        Index("idx_ai_results_observation", "observation_id"),
        Index("idx_ai_results_agent", "agent_name"),
        Index(
            "idx_ai_results_obs_agent",
            "observation_id",
            "agent_name",
            unique=True,
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_id = Column(
        UUID(as_uuid=True), ForeignKey("observations.id"), nullable=False
    )
    agent_name = Column(String(50), nullable=False)
    agent_version = Column(String(20), nullable=False, default="1.0")
    model_used = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)
    result = Column(JSONB, nullable=False)
    processing_time_ms = Column(Integer, nullable=True)
    token_count_input = Column(Integer, nullable=True)
    token_count_output = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    observation = relationship("Observation", back_populates="ai_results")
