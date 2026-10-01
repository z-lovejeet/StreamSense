"""GBIF species occurrence lookup.

Used by Agent 3 (Metadata Validator) to check whether the identified
species has been recorded near the observation GPS coordinates.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 5.0


async def check_gbif_occurrence(
    latitude: float,
    longitude: float,
    species: str,
    radius_km: int = 200,
) -> dict[str, Any] | None:
    """Search GBIF for occurrences of *species* within *radius_km* of the point.

    Returns::

        {
            "species_searched": "Ephemeroptera",
            "records_nearby": 42,
            "radius_km": 200,
        }

    Returns ``None`` on error.
    """
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            # Step 1: species match to get the GBIF taxon key
            match_resp = await client.get(
                f"{settings.gbif_api_url}/species/match",
                params={"name": species, "strict": False},
            )
            match_resp.raise_for_status()
            match_data = match_resp.json()

            taxon_key = match_data.get("usageKey")
            if not taxon_key:
                return {
                    "species_searched": species,
                    "records_nearby": None,
                    "radius_km": radius_km,
                    "note": "Species not found in GBIF taxonomy",
                }

            # Step 2: occurrence search with geo filter
            # GBIF uses decimal degrees for lat/lon and a distance parameter
            occ_resp = await client.get(
                f"{settings.gbif_api_url}/occurrence/search",
                params={
                    "taxonKey": taxon_key,
                    "decimalLatitude": f"{latitude - radius_km / 111:.4f},{latitude + radius_km / 111:.4f}",
                    "decimalLongitude": f"{longitude - radius_km / 111:.4f},{longitude + radius_km / 111:.4f}",
                    "limit": 0,  # We only need the count
                },
            )
            occ_resp.raise_for_status()
            occ_data = occ_resp.json()

            return {
                "species_searched": species,
                "records_nearby": occ_data.get("count", 0),
                "radius_km": radius_km,
            }
    except Exception as exc:
        logger.warning("GBIF occurrence check failed: %s", exc)
        return None
