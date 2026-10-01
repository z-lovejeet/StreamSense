"""Agent 2: Description Interpreter — extract structured env parameters from text.

Uses Groq (cascading model chain) to parse a volunteer's free-text
description into structured JSON environmental parameters.

REF: DOC-05 Section 4
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.prompts.description_prompt import DESCRIPTION_SYSTEM_PROMPT
from app.services.groq_client import groq

logger = logging.getLogger(__name__)


async def run_description_agent(description: str) -> dict[str, Any]:
    """Extract structured environmental parameters from free-text.

    Args:
        description: Volunteer's free-text description of the observation.

    Returns:
        Standard agent result with ``params`` dict and ``confidence``.
    """
    if not description or description.strip() == "":
        return {
            "agent": "description",
            "status": "skipped",
            "params": {},
            "confidence": "low",
            "error": "No description provided",
        }

    try:
        params = await groq.chat_json(
            system=DESCRIPTION_SYSTEM_PROMPT,
            user=(
                f'Extract parameters from this observation description:\n\n'
                f'"{description}"'
            ),
            max_tokens=500,
        )

        return {
            "agent": "description",
            "status": "success",
            "params": params,
            "confidence": params.get("confidence_in_extraction", "medium"),
            "error": None,
        }

    except Exception as exc:
        logger.exception("Description agent failed")
        return {
            "agent": "description",
            "status": "error",
            "params": {},
            "confidence": "low",
            "error": str(exc),
        }
