"""Agent 4: Quality Scorer — weighted confidence scoring and routing decision.

Uses Gemini (cascading chain) to evaluate all Stage 1 agent outputs and
produce a 0–100 confidence score.  Determines routing: ``auto_validate``
(score ≥ 70) or ``expert_review`` (score < 70).

Includes a deterministic rule-based fallback (``fallback_quality_score``)
that activates when all Gemini models are exhausted.

REF: DOC-05 Section 6
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.agents.base import AllModelsExhaustedError
from app.agents.prompts.quality_prompt import QUALITY_SYSTEM_PROMPT
from app.services.gemini_client import gemini

logger = logging.getLogger(__name__)


async def run_quality_agent(
    vision_result: dict[str, Any],
    description_result: dict[str, Any],
    metadata_result: dict[str, Any],
) -> dict[str, Any]:
    """Score observation quality and determine routing.

    Args:
        vision_result: Output from Agent 1 (Vision).
        description_result: Output from Agent 2 (Description).
        metadata_result: Output from Agent 3 (Metadata).

    Returns:
        Dict with ``score`` (0–100), ``routing``, ``reasoning``,
        ``score_breakdown``, ``key_strengths``, ``key_concerns``,
        and ``recommended_action``.
    """
    try:
        prompt = (
            "Evaluate the following agent outputs and calculate a quality score.\n\n"
            f"## Vision Agent Output\n```json\n{json.dumps(vision_result, indent=2)}\n```\n\n"
            f"## Description Agent Output\n```json\n{json.dumps(description_result, indent=2)}\n```\n\n"
            f"## Metadata Agent Output\n```json\n{json.dumps(metadata_result, indent=2)}\n```"
        )

        result = await gemini.generate_json(
            prompt=prompt,
            system=QUALITY_SYSTEM_PROMPT,
            max_output_tokens=1024,
        )

        # Ensure required fields
        result.setdefault("score", 50)
        result.setdefault("routing", "expert_review")
        result.setdefault("reasoning", "")
        result.setdefault("score_breakdown", {})
        result.setdefault("key_strengths", [])
        result.setdefault("key_concerns", [])
        result.setdefault(
            "recommended_action",
            "auto_validate" if result["score"] >= 70 else "expert_review",
        )

        # Safety caps (DOC-05 rules)
        if vision_result.get("status") == "error":
            result["score"] = min(result["score"], 50)
            result["routing"] = "expert_review"

        validity = metadata_result.get("validation", {}).get("overall_validity")
        if validity == "invalid":
            result["score"] = min(result["score"], 30)
            result["routing"] = "expert_review"

        return result

    except AllModelsExhaustedError:
        logger.warning("All Gemini models exhausted — using deterministic fallback")
        return fallback_quality_score(vision_result, description_result, metadata_result)

    except Exception as exc:
        logger.exception("Quality agent failed — using deterministic fallback")
        return fallback_quality_score(vision_result, description_result, metadata_result)


# ── Deterministic fallback (DOC-05 §6.4) ────────────────────────


def fallback_quality_score(
    vision_result: dict[str, Any],
    description_result: dict[str, Any],
    metadata_result: dict[str, Any],
) -> dict[str, Any]:
    """Rule-based scoring fallback when Gemini is unavailable.

    Uses the exact 40/35/25 weighting from DOC-05 Section 6.4.
    """
    score = 0

    # Vision (40 points)
    top_conf = vision_result.get("top_confidence", 0)
    if top_conf >= 0.8:
        vision_pts = 40
    elif top_conf >= 0.5:
        vision_pts = 25
    elif top_conf >= 0.3:
        vision_pts = 15
    else:
        vision_pts = 5
    score += vision_pts

    # Metadata (35 points)
    anomaly_count = metadata_result.get("validation", {}).get("anomaly_count", 0)
    validity = metadata_result.get("validation", {}).get("overall_validity", "unknown")
    if validity == "valid" and anomaly_count == 0:
        meta_pts = 35
    elif anomaly_count <= 1:
        meta_pts = 25
    elif validity != "invalid":
        meta_pts = 10
    else:
        meta_pts = 0
    score += meta_pts

    # Description (25 points)
    desc_conf = description_result.get("confidence", "low")
    params = description_result.get("params", {})
    non_null = sum(1 for v in params.values() if v is not None)
    if desc_conf == "high" and non_null >= 5:
        desc_pts = 25
    elif desc_conf in ("high", "medium") and non_null >= 3:
        desc_pts = 18
    elif non_null > 0:
        desc_pts = 10
    else:
        desc_pts = 5
    score += desc_pts

    routing = "auto_validate" if score >= 70 else "expert_review"

    return {
        "score": score,
        "routing": routing,
        "reasoning": (
            f"Automated score: {score}/100. "
            f"Vision: {top_conf:.0%}, Metadata: {validity}, Description: {desc_conf}."
        ),
        "score_breakdown": {
            "vision_score": vision_pts,
            "vision_reason": f"Top confidence: {top_conf:.0%}",
            "metadata_score": meta_pts,
            "metadata_reason": f"Validity: {validity}, anomalies: {anomaly_count}",
            "description_score": desc_pts,
            "description_reason": f"Confidence: {desc_conf}, params: {non_null}",
        },
        "key_strengths": [],
        "key_concerns": [],
        "recommended_action": routing,
    }
