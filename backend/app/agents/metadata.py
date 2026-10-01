"""Agent 3: Metadata Validator — GPS, timestamp, and external API cross-checks.

Runs Nominatim reverse-geocode, OpenWeatherMap, and GBIF occurrence search
in parallel via ``asyncio.gather``, then sends the combined context to Groq
for anomaly detection.

REF: DOC-05 Section 5
"""

from __future__ import annotations

import asyncio
import json
import logging
import math
from datetime import datetime, timezone
from typing import Any

from app.agents.prompts.metadata_prompt import METADATA_SYSTEM_PROMPT
from app.services.groq_client import groq
from app.utils.gbif import check_gbif_occurrence
from app.utils.geocoding import reverse_geocode
from app.utils.weather import get_weather

logger = logging.getLogger(__name__)

# ── Pilot city coordinates (DOC-05 §5.5) ────────────────────────

PILOT_CITIES: dict[str, dict[str, float]] = {
    "Coimbra": {"lat": 40.2033, "lon": -8.4103, "radius_km": 30},
    "Toulouse": {"lat": 43.6047, "lon": 1.4442, "radius_km": 30},
    "Benevento": {"lat": 41.1297, "lon": 14.7826, "radius_km": 30},
    "Ghent": {"lat": 51.0543, "lon": 3.7174, "radius_km": 30},
    "Oslo": {"lat": 59.9139, "lon": 10.7522, "radius_km": 30},
}


def _check_pilot_city(lat: float, lon: float) -> str | None:
    """Return the pilot city name if (lat, lon) falls within any radius."""
    for city, info in PILOT_CITIES.items():
        dist_km = _haversine(lat, lon, info["lat"], info["lon"])
        if dist_km <= info["radius_km"]:
            return city
    return None


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km between two points."""
    r = 6371.0  # Earth radius km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Main agent function ─────────────────────────────────────────


async def run_metadata_agent(
    latitude: float,
    longitude: float,
    timestamp: str,
    species: str | None = None,
) -> dict[str, Any]:
    """Validate observation metadata against external data sources.

    Runs geocode, weather, and GBIF lookups in parallel, then asks
    Groq to evaluate anomalies.

    Args:
        latitude: GPS latitude.
        longitude: GPS longitude.
        timestamp: ISO-8601 observation timestamp.
        species: Optional species name identified by Agent 1 (for GBIF check).

    Returns:
        Standard agent result with ``validation`` sub-dict and ``pilot_city``.
    """
    try:
        # Fire external API calls in parallel
        tasks = [
            reverse_geocode(latitude, longitude),
            get_weather(latitude, longitude),
        ]
        if species:
            tasks.append(check_gbif_occurrence(latitude, longitude, species))
        else:
            # placeholder coroutine so gather index stays aligned
            async def _noop() -> None:
                return None

            tasks.append(_noop())

        results = await asyncio.gather(*tasks, return_exceptions=True)

        geocode_result = results[0] if not isinstance(results[0], Exception) else None
        weather_result = results[1] if not isinstance(results[1], Exception) else None
        gbif_result = results[2] if not isinstance(results[2], Exception) else None

        # Determine pilot city
        pilot_city = _check_pilot_city(latitude, longitude)

        # Build context for LLM
        context = (
            f"GPS: {latitude}, {longitude}\n"
            f"Reverse Geocode: {json.dumps(geocode_result) if geocode_result else 'unavailable'}\n"
            f"Pilot City Match: {pilot_city or 'none'}\n"
            f"Timestamp: {timestamp}\n"
            f"Current UTC: {datetime.now(timezone.utc).isoformat()}\n"
            f"Weather: {json.dumps(weather_result) if weather_result else 'unavailable'}\n"
            f"Species identified: {species or 'none'}\n"
            f"GBIF records nearby: {json.dumps(gbif_result) if gbif_result else 'unavailable'}\n"
        )

        validation = await groq.chat_json(
            system=METADATA_SYSTEM_PROMPT,
            user=f"Validate this observation metadata:\n{context}",
            max_tokens=500,
        )

        return {
            "agent": "metadata",
            "status": "success",
            "validation": validation,
            "pilot_city": pilot_city,
            "error": None,
        }

    except Exception as exc:
        logger.exception("Metadata agent failed")
        return {
            "agent": "metadata",
            "status": "error",
            "validation": {
                "overall_validity": "unknown",
                "anomalies": [],
                "anomaly_count": 0,
            },
            "pilot_city": _check_pilot_city(latitude, longitude),
            "error": str(exc),
        }
