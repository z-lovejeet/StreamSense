"""Agent 5: FHIR Translator — convert validated observations to FHIR R4 resources.

Uses Gemini (cascading chain) to generate FHIR R4 Observation resources
compliant with the OAH Implementation Guide.  Includes a validation loop
using ``fhir.resources`` — retries once on failure with error context.

REF: DOC-05 Section 7, DOC-08 Sections 6–7
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.agents.base import AllModelsExhaustedError
from app.agents.prompts.fhir_prompt import FHIR_TRANSLATOR_SYSTEM_PROMPT
from app.services.gemini_client import gemini

logger = logging.getLogger(__name__)

# ── Pre-crafted demo fallback (DOC-08 §9) ───────────────────────

DEMO_FHIR_OBSERVATION: dict[str, Any] = {
    "resourceType": "Observation",
    "meta": {
        "profile": [
            "http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah"
        ]
    },
    "status": "final",
    "category": [
        {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "survey",
                    "display": "Survey",
                }
            ]
        }
    ],
    "code": {
        "coding": [
            {
                "system": "http://loinc.org",
                "code": "72166-2",
                "display": "Environmental assessment",
            }
        ],
        "text": "Stream Health Observation",
    },
    "effectiveDateTime": "2026-09-29T14:30:00+01:00",
    "issued": "2026-09-29T14:30:05+01:00",
    "valueString": (
        "Macroinvertebrate community assessment — Ephemeroptera detected, "
        "indicating good water quality"
    ),
    "component": [
        {
            "code": {
                "coding": [
                    {
                        "system": "http://streamsense.eu/codes",
                        "code": "species-identified",
                    }
                ]
            },
            "valueString": "Ephemeroptera (Mayfly nymph)",
        },
        {
            "code": {
                "coding": [
                    {
                        "system": "http://streamsense.eu/codes",
                        "code": "species-confidence",
                    }
                ]
            },
            "valueQuantity": {
                "value": 89,
                "unit": "%",
                "system": "http://unitsofmeasure.org",
                "code": "%",
            },
        },
        {
            "code": {
                "coding": [
                    {"system": "http://streamsense.eu/codes", "code": "bmwp-score"}
                ]
            },
            "valueQuantity": {"value": 10, "unit": "score"},
        },
        {
            "code": {
                "coding": [
                    {
                        "system": "http://streamsense.eu/codes",
                        "code": "water-quality-indication",
                    }
                ]
            },
            "valueString": "good",
        },
        {
            "code": {
                "coding": [
                    {
                        "system": "http://streamsense.eu/codes",
                        "code": "ai-confidence-score",
                    }
                ]
            },
            "valueQuantity": {"value": 87, "unit": "score"},
        },
        {
            "code": {
                "coding": [
                    {
                        "system": "http://streamsense.eu/codes",
                        "code": "disease-vector-detected",
                    }
                ]
            },
            "valueBoolean": False,
        },
    ],
}


# ── Validation helper ────────────────────────────────────────────


def _validate_fhir_observation(resource_dict: dict) -> tuple[bool, str]:
    """Validate a FHIR Observation resource using fhir.resources."""
    try:
        from fhir.resources.observation import Observation

        obs = Observation.model_validate(resource_dict)
        return True, obs.model_dump_json(exclude_none=True)
    except Exception as exc:
        return False, str(exc)


# ── Main agent function ─────────────────────────────────────────


async def run_fhir_agent(
    all_results: dict[str, Any],
    *,
    max_retries: int = 1,
) -> dict[str, Any]:
    """Generate a FHIR R4 Observation resource from pipeline results.

    Validates the generated resource with ``fhir.resources``.  On
    validation failure, retries once with the error message appended
    to the prompt.

    Args:
        all_results: Dict of all agent results (vision, description,
            metadata, quality).
        max_retries: Number of validation retries (default 1).

    Returns:
        Agent result with ``resource_json`` and ``validation_status``.
    """
    try:
        # Build context from all results
        vision = all_results.get("vision", {})
        desc = all_results.get("description", {})
        meta = all_results.get("metadata", {})
        quality = all_results.get("quality", {})

        context = (
            f"Species: {vision.get('top_species', 'unknown')}\n"
            f"Common name: {(vision.get('predictions', [{}]) or [{}])[0].get('common_name', 'unknown')}\n"
            f"Confidence: {vision.get('top_confidence', 0)}\n"
            f"BMWP Score: {vision.get('bmwp_score', 0)}\n"
            f"Water quality: {vision.get('water_quality_indication', 'unknown')}\n"
            f"Disease vector: {vision.get('is_disease_vector', False)}\n"
            f"Quality score: {quality.get('score', 0)}\n"
            f"Routing: {quality.get('routing', 'unknown')}\n"
            f"Environmental params: {json.dumps(desc.get('params', {}))}\n"
            f"Pilot city: {meta.get('pilot_city', 'unknown')}\n"
            f"GPS: {meta.get('validation', {}).get('gps_location_name', 'unknown')}\n"
        )

        error_context: str | None = None

        for attempt in range(max_retries + 1):
            prompt = f"Generate a FHIR R4 Observation resource from this data:\n\n{context}"
            if error_context:
                prompt += f"\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n{error_context}\nFix the issue and regenerate."

            text = await gemini.generate(
                prompt=prompt,
                system=FHIR_TRANSLATOR_SYSTEM_PROMPT,
                json_mode=True,
                max_output_tokens=2048,
            )
            resource_dict = json.loads(text)

            is_valid, result = _validate_fhir_observation(resource_dict)

            if is_valid:
                return {
                    "agent": "fhir",
                    "status": "success",
                    "resource_json": json.loads(result),
                    "validation_status": "valid",
                    "error": None,
                }

            # Validation failed — prepare retry context
            error_context = result
            logger.warning(
                "FHIR validation failed (attempt %d/%d): %s",
                attempt + 1,
                max_retries + 1,
                result[:200],
            )

        # All retries exhausted
        return {
            "agent": "fhir",
            "status": "error",
            "resource_json": resource_dict,
            "validation_status": "invalid",
            "error": f"Validation failed after {max_retries + 1} attempts: {error_context}",
        }

    except AllModelsExhaustedError:
        logger.warning("Gemini exhausted for FHIR — using demo fallback")
        return {
            "agent": "fhir",
            "status": "fallback",
            "resource_json": DEMO_FHIR_OBSERVATION,
            "validation_status": "valid",
            "error": "Used pre-crafted demo resource (Gemini unavailable)",
        }

    except Exception as exc:
        logger.exception("FHIR agent failed")
        return {
            "agent": "fhir",
            "status": "error",
            "resource_json": None,
            "validation_status": "error",
            "error": str(exc),
        }
