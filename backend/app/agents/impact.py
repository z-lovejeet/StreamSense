"""Agent 6: Impact Generator — plain-language impact receipt for citizens.

Uses Groq (cascading model chain) to generate a warm, encouraging
impact statement explaining what the AI found and how the citizen's
data contributes to One Health outcomes.

Always runs — every citizen gets an impact receipt regardless of
confidence routing.

REF: DOC-05 Section 8
"""

from __future__ import annotations

import logging
from typing import Any

from app.agents.prompts.impact_prompt import IMPACT_SYSTEM_PROMPT
from app.services.groq_client import groq

logger = logging.getLogger(__name__)

# Static fallback when all Groq models are exhausted (DOC-05 §11)
_FALLBACK_IMPACT: dict[str, str] = {
    "impact_text": (
        "Thank you for your observation! Your data has been processed "
        "and contributes to stream health monitoring in your community."
    ),
    "headline": "Your Observation Makes a Difference",
    "ecological_insight": (
        "Every observation helps build a clearer picture of local water quality."
    ),
    "health_connection": (
        "Stream monitoring data helps researchers track potential disease vectors "
        "in your neighbourhood."
    ),
}


async def run_impact_agent(impact_input: dict[str, Any]) -> dict[str, Any]:
    """Generate a plain-language impact receipt for the citizen.

    Args:
        impact_input: Dict with keys ``species``, ``common_name``,
            ``confidence``, ``quality_score``, ``routing``,
            ``water_quality``, ``is_disease_vector``,
            ``location_name``, ``description_params``.

    Returns:
        Agent result with ``impact_text``, ``headline``,
        ``ecological_insight``, and ``health_connection``.
    """
    try:
        user_prompt = (
            "Generate an impact receipt for this observation:\n\n"
            f"Species: {impact_input.get('species', 'unknown')}\n"
            f"Common name: {impact_input.get('common_name', 'unknown')}\n"
            f"Confidence: {impact_input.get('confidence', 0)}\n"
            f"Quality score: {impact_input.get('quality_score', 0)}/100\n"
            f"Routing: {impact_input.get('routing', 'unknown')}\n"
            f"Water quality: {impact_input.get('water_quality', 'unknown')}\n"
            f"Disease vector: {impact_input.get('is_disease_vector', False)}\n"
            f"Location: {impact_input.get('location_name', 'your area')}\n"
        )

        result = await groq.chat_json(
            system=IMPACT_SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=400,
        )

        # Ensure required fields
        result.setdefault("impact_text", _FALLBACK_IMPACT["impact_text"])
        result.setdefault("headline", _FALLBACK_IMPACT["headline"])
        result.setdefault("ecological_insight", _FALLBACK_IMPACT["ecological_insight"])
        result.setdefault("health_connection", _FALLBACK_IMPACT["health_connection"])

        return {
            "agent": "impact",
            "status": "success",
            **result,
            "error": None,
        }

    except Exception as exc:
        logger.warning("Impact agent failed — using fallback template: %s", exc)
        return {
            "agent": "impact",
            "status": "fallback",
            **_FALLBACK_IMPACT,
            "error": str(exc),
        }
