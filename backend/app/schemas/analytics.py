"""Analytics schemas for StreamSense backend.

Defines schemas for system summary statistics and species distribution reporting.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field  # noqa: F401


class SummaryStats(BaseModel):
    """High-level summary statistics across all observations."""

    model_config = ConfigDict(from_attributes=True)

    total_observations: int
    auto_validated: int
    expert_validated: int
    rejected: int
    pending_review: int
    avg_confidence: float | None = None
    avg_pipeline_time: float | None = None


class SpeciesDistribution(BaseModel):
    """Aggregated species occurrence and confidence distribution."""

    model_config = ConfigDict(from_attributes=True)

    top_species: str
    common_name: str | None = None
    count: int
    avg_confidence: float | None = None
