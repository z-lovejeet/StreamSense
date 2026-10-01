"""FHIR validation and sandbox POST service.

Provides local validation via ``fhir.resources`` and HTTP POST to the
HL7 Europe OAH FHIR sandbox.  Includes retry logic with exponential
backoff.

REF: DOC-08 Sections 5, 7
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


# ── Local validation ─────────────────────────────────────────────


def validate_observation(resource_dict: dict) -> tuple[bool, str | None]:
    """Validate a FHIR Observation resource locally.

    Returns ``(True, serialized_json)`` on success, or
    ``(False, error_message)`` on failure.
    """
    try:
        from fhir.resources.observation import Observation

        obs = Observation.model_validate(resource_dict)
        return True, obs.model_dump_json(exclude_none=True)
    except Exception as exc:
        return False, str(exc)


def validate_location(resource_dict: dict) -> tuple[bool, str | None]:
    """Validate a FHIR Location resource locally."""
    try:
        from fhir.resources.location import Location

        loc = Location.model_validate(resource_dict)
        return True, loc.model_dump_json(exclude_none=True)
    except Exception as exc:
        return False, str(exc)


# ── Sandbox POST ─────────────────────────────────────────────────

_FHIR_HEADERS = {
    "Content-Type": "application/fhir+json",
    "Accept": "application/fhir+json",
}


async def post_to_fhir_sandbox(
    resource_json: dict,
    resource_type: str = "Observation",
    *,
    max_retries: int = 2,
    base_delay: float = 1.0,
) -> dict[str, Any]:
    """POST a validated FHIR resource to the OAH sandbox.

    Retries with exponential backoff on 5xx or timeout errors.

    Returns:
        ``{"status": "posted", "sandbox_id": "...", "response_status": 201}``
        on success, or ``{"status": "failed"|"error", ...}`` on failure.
    """
    sandbox_url = settings.fhir_sandbox_url

    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{sandbox_url}/{resource_type}",
                    json=resource_json,
                    headers=_FHIR_HEADERS,
                )

                if response.status_code == 201:
                    created = response.json()
                    return {
                        "status": "posted",
                        "sandbox_id": created.get("id"),
                        "response_status": 201,
                    }

                if response.status_code >= 500 and attempt < max_retries:
                    # Retry on server errors
                    delay = base_delay * (2**attempt)
                    logger.warning(
                        "FHIR sandbox returned %d — retrying in %.1fs (attempt %d/%d)",
                        response.status_code,
                        delay,
                        attempt + 1,
                        max_retries + 1,
                    )
                    await asyncio.sleep(delay)
                    continue

                return {
                    "status": "failed",
                    "response_status": response.status_code,
                    "error": response.text[:500],
                }

        except httpx.TimeoutException:
            if attempt < max_retries:
                delay = base_delay * (2**attempt)
                logger.warning(
                    "FHIR sandbox timed out — retrying in %.1fs", delay
                )
                await asyncio.sleep(delay)
                continue
            return {"status": "error", "error": "Sandbox request timed out"}

        except Exception as exc:
            return {"status": "error", "error": str(exc)}

    return {"status": "error", "error": "Exhausted retries"}


# ── Bundle generation ────────────────────────────────────────────


def generate_fhir_bundle(
    resources: list[dict],
    bundle_type: str = "transaction",
) -> dict:
    """Wrap multiple FHIR resources in a Bundle for bulk POST.

    Each resource is assigned a ``urn:uuid`` full URL and a POST request.
    """
    import uuid

    entries = []
    for resource in resources:
        resource_type = resource.get("resourceType", "Observation")
        entries.append(
            {
                "fullUrl": f"urn:uuid:{uuid.uuid4()}",
                "resource": resource,
                "request": {
                    "method": "POST",
                    "url": resource_type,
                },
            }
        )

    return {
        "resourceType": "Bundle",
        "type": bundle_type,
        "entry": entries,
    }
