"""Reverse geocoding and water-body proximity check via Nominatim.

Nominatim Terms of Use require:
  • At most 1 request per second
  • A custom User-Agent header

We use a simple ``asyncio.Lock`` to serialize calls.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
_HEADERS = {"User-Agent": "StreamSense/0.1 (citizen-science-hackathon)"}
_TIMEOUT = 5.0  # seconds
_lock = asyncio.Lock()


async def reverse_geocode(
    latitude: float,
    longitude: float,
) -> dict[str, Any] | None:
    """Reverse-geocode GPS coordinates via Nominatim.

    Returns a dict with ``display_name``, ``address`` sub-dict, and
    raw ``type`` / ``class`` fields.  Returns ``None`` on error.
    """
    async with _lock:
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.get(
                    f"{_NOMINATIM_BASE}/reverse",
                    params={
                        "lat": latitude,
                        "lon": longitude,
                        "format": "json",
                        "addressdetails": 1,
                        "zoom": 16,
                    },
                    headers=_HEADERS,
                )
                resp.raise_for_status()
                data = resp.json()

                return {
                    "display_name": data.get("display_name"),
                    "type": data.get("type"),
                    "class": data.get("class"),
                    "address": data.get("address", {}),
                }
        except Exception as exc:
            logger.warning("Nominatim reverse geocode failed: %s", exc)
            return None


async def is_near_water(
    latitude: float,
    longitude: float,
    radius_m: int = 200,
) -> bool | None:
    """Check whether the point is within *radius_m* metres of a waterway.

    Uses Nominatim ``/search`` with ``[water]`` bounded by a tiny bbox
    around the point.  Returns ``True`` / ``False``, or ``None`` on
    error.
    """
    # ≈ 0.002 degrees ≈ 200 m at mid-latitudes
    delta = radius_m / 111_000
    bbox = (
        longitude - delta,
        latitude - delta,
        longitude + delta,
        latitude + delta,
    )

    async with _lock:
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                resp = await client.get(
                    f"{_NOMINATIM_BASE}/search",
                    params={
                        "q": "water",
                        "format": "json",
                        "bounded": 1,
                        "viewbox": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
                        "limit": 1,
                    },
                    headers=_HEADERS,
                )
                resp.raise_for_status()
                results = resp.json()
                return len(results) > 0
        except Exception as exc:
            logger.warning("Nominatim water check failed: %s", exc)
            return None
