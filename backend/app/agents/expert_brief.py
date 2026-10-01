"""Agent 7: Expert Brief Generator — structured review brief for researchers.

Uses Gemini (cascading chain) to generate a concise expert review brief
highlighting specific concerns and recommending what the researcher
should check.  Only runs on the LOW confidence path (score < 70).

REF: DOC-05 Section 9
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.agents.base import AllModelsExhaustedError
from app.agents.prompts.expert_brief_prompt import EXPERT_BRIEF_SYSTEM_PROMPT
from app.services.gemini_client import gemini

logger = logging.getLogger(__name__)


async def run_expert_brief_agent(all_results: dict[str, Any]) -> dict[str, Any]:
    """Generate an expert review brief for a low-confidence observation.

    Args:
        all_results: Dict of all agent results (vision, description,
            metadata, quality).

    Returns:
        Agent result with ``summary``, ``concerns`` list,
        ``recommended_action``, ``priority``, ``estimated_review_time``.
    """
    try:
        prompt = (
            "Generate an expert review brief for this observation:\n\n"
            f"## Vision Analysis\n```json\n{json.dumps(all_results.get('vision', {}), indent=2)}\n```\n\n"
            f"## Description Extraction\n```json\n{json.dumps(all_results.get('description', {}), indent=2)}\n```\n\n"
            f"## Metadata Validation\n```json\n{json.dumps(all_results.get('metadata', {}), indent=2)}\n```\n\n"
            f"## Quality Score\n```json\n{json.dumps(all_results.get('quality', {}), indent=2)}\n```"
        )

        result = await gemini.generate_json(
            prompt=prompt,
            system=EXPERT_BRIEF_SYSTEM_PROMPT,
            max_output_tokens=1024,
        )

        # Ensure required fields
        result.setdefault("summary", "AI analysis could not generate a summary.")
        result.setdefault("concerns", [])
        result.setdefault("recommended_action", "requires_careful_review")
        result.setdefault("priority", "medium")
        result.setdefault("estimated_review_time", "1-2 minutes")

        return {
            "agent": "expert_brief",
            "status": "success",
            **result,
            "error": None,
        }

    except AllModelsExhaustedError:
        logger.warning("Gemini exhausted for Expert Brief — returning raw outputs")
        return _raw_fallback(all_results)

    except Exception as exc:
        logger.exception("Expert Brief agent failed")
        return _raw_fallback(all_results, error=str(exc))


def _raw_fallback(
    all_results: dict[str, Any],
    error: str | None = None,
) -> dict[str, Any]:
    """Fallback: surface raw agent outputs to researcher without synthesis."""
    vision = all_results.get("vision", {})
    quality = all_results.get("quality", {})

    return {
        "agent": "expert_brief",
        "status": "fallback",
        "summary": (
            f"Auto-generated brief unavailable. "
            f"Species: {vision.get('top_species', 'unknown')} "
            f"(confidence: {vision.get('top_confidence', 0):.0%}). "
            f"Quality score: {quality.get('score', '?')}/100."
        ),
        "concerns": [
            {
                "type": "photo_quality",
                "severity": "medium",
                "detail": "AI brief generation failed — manual review of all outputs required.",
                "check_recommendation": "Review raw agent data below.",
            }
        ],
        "recommended_action": "requires_careful_review",
        "priority": "medium",
        "estimated_review_time": "3-5 minutes",
        "raw_agent_outputs": {
            k: v for k, v in all_results.items() if k != "quality"
        },
        "error": error or "Gemini unavailable — raw outputs surfaced",
    }
