"""Agent 1: Vision Analyzer — Gemini Multimodal Bioindicator Identification.

Identifies macroinvertebrate taxa (mayflies, stoneflies, caddisflies, snails, etc.)
from citizen stream photos using Google Gemini Vision with cascading model fallback.

REF: DOC-05 Section 3
"""

from __future__ import annotations

import io
import json
import logging
from typing import Any

from google import genai
import httpx
from PIL import Image

from app.agents.prompts.vision_config import (
    BMWP_SCORES,
    DISEASE_VECTOR_TAXA,
    TARGET_TAXA,
    TAXA_COMMON_NAMES,
    get_quality_indication,
)
from app.config import settings

logger = logging.getLogger(__name__)

VISION_PROMPT = f"""You are a senior freshwater ecologist, limnologist, and macroinvertebrate specialist for the OneAquaHealth citizen science platform.

Analyze this stream/river/canal photo comprehensively. Evaluate every ecological dimension: water quality, aquatic vegetation, macroinvertebrate organisms/insects, and environmental/hygienic issues.

Taxa Reference List for Bioindicators (inspect rocks, gravel, substrate, water surface, vegetation, stems):
{TARGET_TAXA}

Classification guide for organisms:
- Mayfly nymphs -> Ephemeroptera (BMWP 10) or Baetidae (small, BMWP 4) or Heptageniidae (flat-headed, BMWP 10)
- Stonefly nymphs -> Plecoptera (BMWP 10) or Leuctridae (BMWP 10)
- Caddisfly larvae -> Trichoptera (BMWP 8) or Hydropsychidae (net-spinning, BMWP 5)
- Freshwater shrimp -> Gammaridae (BMWP 6)
- Water louse -> Asellidae (BMWP 3)
- Freshwater snails -> Gastropoda (BMWP 3)
- Midge larvae -> Chironomidae (BMWP 2)
- Aquatic worms -> Oligochaeta (BMWP 1) or Tubificidae (BMWP 1)
- Mosquito larvae -> Culicidae (BMWP 0, disease vector)
- Blackfly larvae -> Simuliidae (BMWP 5, disease vector)

Return strict JSON only (no markdown, no extra commentary):
{{
  "top_species": "Exact taxon from Target list if visible or highly probable, else null",
  "confidence": 0.85,
  "predictions": [
    {{"taxon": "Taxon name", "confidence": 0.85, "notes": "Location or substrate feature"}}
  ],
  "water_quality": {{
    "clarity": "transparent" | "slightly_turbid" | "turbid" | "opaque" | "sediment_laden",
    "color": "clear" | "olive_green" | "emerald_green" | "brown_murky" | "dark" | "tea_colored",
    "flow_condition": "stagnant" | "slow_moving" | "moderate_flow" | "fast_rippling" | "torrential",
    "surface_sheen": "clean_surface" | "algae_film" | "oily_sheen" | "organic_foam" | "scum",
    "water_rating": "good" | "moderate" | "poor" | "severely_degraded"
  }},
  "vegetation": {{
    "floating_plants": "water lilies (Nymphaeaceae)" | "duckweed" | "none" | "algae pads" | "leaf litter",
    "submerged_macrophytes": "abundant" | "moderate" | "sparse" | "absent",
    "algal_coverage": "none" | "light_periphyton" | "moderate_mats" | "heavy_bloom",
    "riparian_banks": "natural_vegetated" | "wooded_overhang" | "urban_concrete" | "eroded_soil"
  }},
  "hygiene_and_health_issues": {{
    "hygiene_status": "clean_natural" | "minor_litter" | "moderate_anthropogenic_stress" | "unhealthy_polluted",
    "litter_or_debris": "none" | "natural_woody_debris" | "plastic_litter" | "industrial_waste",
    "eutrophication_risk": "low" | "moderate" | "high" | "severe",
    "disease_vector_risk": "low" | "moderate" | "high",
    "unhealthy_factors": ["list of specific issues observed, e.g. Stagnant standing water, Floating scum, Plastic debris, Lack of riffle oxygenation"]
  }},
  "substrate_type": "rocky_granite" | "gravel_pebbles" | "silt_mud" | "concrete_canal" | "sand",
  "ecological_summary": "2-3 clear, informative sentences describing the overall stream condition, water clarity, vegetation observed, and environmental health.",
  "visual_evidence": "1-2 sentences on specific organisms or bioindicators seen.",
  "habitat_notes": "1-2 sentences on micro-habitat and ecological suitability."
}}
"""

_VISION_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
]


async def run_vision_agent(image_url: str) -> dict[str, Any]:
    """Identify macroinvertebrate species from a citizen photo via Gemini Vision."""
    try:
        # Download or load image
        if image_url.startswith("file://"):
            image = Image.open(image_url[7:])
        elif image_url.startswith("/") or image_url.startswith("./"):
            image = Image.open(image_url)
        else:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(image_url)
                response.raise_for_status()
                image = Image.open(io.BytesIO(response.content))

        # Query Gemini Vision with cascading model chain
        client = genai.Client(api_key=settings.gemini_api_key)
        parsed_data = None
        last_error = None

        for model in _VISION_MODELS:
            try:
                resp = await client.aio.models.generate_content(
                    model=model,
                    contents=[image, VISION_PROMPT],
                )
                raw = resp.text.strip()
                if raw.startswith("```"):
                    raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
                parsed_data = json.loads(raw)
                logger.info("Vision analysis succeeded using model %s", model)
                break
            except Exception as e:
                last_error = e
                logger.warning(
                    "Vision model %s failed: %s, falling through...", model, e
                )
                continue

        if parsed_data is None:
            raise RuntimeError(
                f"All vision models failed. Last error: {last_error}"
            )

        top_taxon = parsed_data.get("top_species")
        top_conf = float(parsed_data.get("confidence", 0.0))

        # Format predictions list
        raw_preds = parsed_data.get("predictions", [])
        predictions: list[dict[str, Any]] = []

        if top_taxon and not raw_preds:
            raw_preds = [{"taxon": top_taxon, "confidence": top_conf}]

        for item in raw_preds:
            taxon = item.get("taxon")
            if taxon in TARGET_TAXA:
                conf = float(item.get("confidence", top_conf))
                predictions.append(
                    {
                        "taxon": taxon,
                        "confidence": round(conf, 4),
                        "common_name": TAXA_COMMON_NAMES.get(taxon, taxon),
                        "bmwp_score": BMWP_SCORES.get(taxon, 0),
                    }
                )

        # Ensure top prediction is in predictions
        if top_taxon and not any(p["taxon"] == top_taxon for p in predictions):
            predictions.insert(
                0,
                {
                    "taxon": top_taxon,
                    "confidence": round(top_conf, 4),
                    "common_name": TAXA_COMMON_NAMES.get(top_taxon, top_taxon),
                    "bmwp_score": BMWP_SCORES.get(top_taxon, 0),
                },
            )

        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        top = predictions[0] if predictions else None

        wq = parsed_data.get("water_quality", {})
        veg = parsed_data.get("vegetation", {})
        hygiene = parsed_data.get("hygiene_and_health_issues", {})

        if top and top["taxon"]:
            water_quality_ind = get_quality_indication(top["taxon"])
        else:
            water_rating = wq.get("water_rating", "moderate")
            water_quality_ind = (
                "good"
                if water_rating == "good"
                else (
                    "poor"
                    if water_rating in ("poor", "severely_degraded")
                    else "moderate"
                )
            )

        is_vector = (
            (top["taxon"] in DISEASE_VECTOR_TAXA)
            if top
            else (hygiene.get("disease_vector_risk") == "high")
        )

        return {
            "agent": "vision",
            "status": "success",
            "predictions": predictions,
            "top_species": top["taxon"] if top else None,
            "top_confidence": top["confidence"] if top else 0.0,
            "bmwp_score": top["bmwp_score"] if top else 0,
            "water_quality_indication": water_quality_ind,
            "is_disease_vector": is_vector,
            "water_quality": wq,
            "vegetation": veg,
            "hygiene_and_health_issues": hygiene,
            "substrate_type": parsed_data.get("substrate_type"),
            "ecological_summary": (
                parsed_data.get("ecological_summary")
                or parsed_data.get("visual_evidence")
                or "Stream scene analyzed."
            ),
            "visual_evidence": parsed_data.get("visual_evidence"),
            "habitat_notes": parsed_data.get("habitat_notes"),
            "error": None,
        }

    except Exception as exc:
        logger.exception("Vision agent failed: %s", exc)
        return {
            "agent": "vision",
            "status": "error",
            "predictions": [],
            "top_species": None,
            "top_confidence": 0.0,
            "bmwp_score": 0,
            "water_quality_indication": "unknown",
            "is_disease_vector": False,
            "error": str(exc),
        }
