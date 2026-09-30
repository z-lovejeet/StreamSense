"""AI result schemas for StreamSense backend.

Defines schemas for storing and returning outputs from specialized AI pipeline agents.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field  # noqa: F401


class AIResultResponse(BaseModel):
    """Output result produced by an AI pipeline agent."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    observation_id: uuid.UUID
    agent_name: str
    agent_version: str
    model_used: str
    status: str
    result: dict[str, Any]
    processing_time_ms: int | None = None
    token_count_input: int | None = None
    token_count_output: int | None = None
    error_message: str | None = None
    created_at: datetime
