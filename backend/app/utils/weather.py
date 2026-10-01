"""OpenWeatherMap current-weather lookup.

Used by Agent 3 (Metadata Validator) to cross-check weather conditions
at the observation location and time.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_OWM_BASE = "https://api.openweathermap.org/data/2.5"
_TIMEOUT = 5.0


async def get_weather(
    latitude: float,
    longitude: float,
) -> dict[str, Any] | None:
    """Fetch current weather at (*latitude*, *longitude*).

    Returns a simplified dict::

        {
            "temperature_c": 22.5,
            "condition": "clear sky",
            "humidity": 65,
            "wind_speed_ms": 3.1,
        }

    Returns ``None`` on error.
    """
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                f"{_OWM_BASE}/weather",
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "appid": settings.openweathermap_api_key,
                    "units": "metric",
                },
            )
            resp.raise_for_status()
            data = resp.json()

            return {
                "temperature_c": data.get("main", {}).get("temp"),
                "condition": data.get("weather", [{}])[0].get("description", "unknown"),
                "humidity": data.get("main", {}).get("humidity"),
                "wind_speed_ms": data.get("wind", {}).get("speed"),
            }
    except Exception as exc:
        logger.warning("OpenWeatherMap lookup failed: %s", exc)
        return None
