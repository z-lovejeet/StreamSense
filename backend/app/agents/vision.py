"""Agent 1: Vision Analyzer — BioCLIP 2 species identification.

Identifies macroinvertebrate species from citizen-uploaded stream photos
using BioCLIP 2 (local CPU inference via ``pybioclip``).

The classifier is loaded lazily on first call to avoid slowing down
server startup when the agent isn't needed (e.g., during tests).

REF: DOC-05 Section 3
"""

from __future__ import annotations

import asyncio
import io
import logging
from typing import Any

import httpx
from PIL import Image

from app.agents.prompts.vision_config import (
    BMWP_SCORES,
    DISEASE_VECTOR_TAXA,
    TARGET_TAXA,
    TAXA_COMMON_NAMES,
    get_quality_indication,
)

logger = logging.getLogger(__name__)

# ── Lazy model loading ───────────────────────────────────────────
_classifier = None


def _get_classifier():
    """Load BioCLIP classifier on first use (~300 MB, a few seconds)."""
    global _classifier
    if _classifier is None:
        from pybioclip import TreeOfLifeClassifier

        logger.info("Loading BioCLIP 2 model (first call)…")
        _classifier = TreeOfLifeClassifier()
        logger.info("BioCLIP 2 model loaded.")
    return _classifier


# ── Main agent function ──────────────────────────────────────────


async def run_vision_agent(image_url: str) -> dict[str, Any]:
    """Identify macroinvertebrate species from a citizen photo.

    Args:
        image_url: Public URL to the uploaded image.

    Returns:
        Standard agent result dict with ``predictions``, ``top_species``,
        ``top_confidence``, ``bmwp_score``, ``water_quality_indication``,
        and ``is_disease_vector`` fields.
    """
    try:
        # Download image
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content))

        # Run BioCLIP classification in thread pool (CPU-bound)
        classifier = _get_classifier()
        loop = asyncio.get_running_loop()
        results = await loop.run_in_executor(
            None,
            lambda: classifier.predict(image, TARGET_TAXA),
        )

        # Process results — top 5 by confidence
        predictions: list[dict[str, Any]] = []
        for taxon, score in sorted(
            results.items(), key=lambda x: x[1], reverse=True
        )[:5]:
            predictions.append(
                {
                    "taxon": taxon,
                    "confidence": round(score, 4),
                    "common_name": TAXA_COMMON_NAMES.get(taxon, taxon),
                    "bmwp_score": BMWP_SCORES.get(taxon, 0),
                }
            )

        top = predictions[0] if predictions else None

        return {
            "agent": "vision",
            "status": "success",
            "predictions": predictions,
            "top_species": top["taxon"] if top else None,
            "top_confidence": top["confidence"] if top else 0,
            "bmwp_score": top["bmwp_score"] if top else 0,
            "water_quality_indication": (
                get_quality_indication(top["taxon"]) if top else "unknown"
            ),
            "is_disease_vector": (
                top["taxon"] in DISEASE_VECTOR_TAXA if top else False
            ),
            "error": None,
        }

    except Exception as exc:
        logger.exception("Vision agent failed")
        return {
            "agent": "vision",
            "status": "error",
            "predictions": [],
            "top_species": None,
            "top_confidence": 0,
            "bmwp_score": 0,
            "water_quality_indication": "unknown",
            "is_disease_vector": False,
            "error": str(exc),
        }
