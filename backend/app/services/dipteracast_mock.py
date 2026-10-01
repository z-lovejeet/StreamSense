"""DipteraCAST mock — simulated disease vector risk prediction.

In a production system this would call the DipteraCAST API.  For the
hackathon demo we return a plausible simulated prediction based on
species identification and environmental conditions.

REF: DOC-04
"""

from __future__ import annotations

import random
from typing import Any


async def predict_disease_vector(
    latitude: float,
    longitude: float,
    temperature_c: float | None = None,
    species: str | None = None,
    is_disease_vector: bool = False,
) -> dict[str, Any]:
    """Return a simulated disease vector risk prediction.

    If the identified species is a known disease vector (``Culicidae``,
    ``Simuliidae``), risk is automatically elevated.  Otherwise risk
    is estimated from environmental conditions.

    Returns:
        Dict with ``risk_level``, ``prediction_text``, ``model_version``,
        and ``factors``.
    """

    factors: list[str] = []
    base_risk = 0.15  # baseline probability

    # Species-based adjustment
    if is_disease_vector:
        base_risk = 0.75
        factors.append(f"Disease vector species detected: {species}")
    elif species:
        factors.append(f"Non-vector species identified: {species}")

    # Temperature adjustment
    if temperature_c is not None:
        if temperature_c > 25:
            base_risk += 0.2
            factors.append(f"Warm temperature ({temperature_c:.1f}°C) favours vector breeding")
        elif temperature_c > 15:
            base_risk += 0.05
            factors.append(f"Moderate temperature ({temperature_c:.1f}°C)")
        else:
            base_risk -= 0.05
            factors.append(f"Cool temperature ({temperature_c:.1f}°C) reduces vector activity")

    # Add a small amount of randomness for realism
    base_risk += random.uniform(-0.05, 0.05)
    base_risk = max(0.0, min(1.0, base_risk))

    # Map probability to risk level
    if base_risk >= 0.7:
        risk_level = "critical" if is_disease_vector else "high"
    elif base_risk >= 0.4:
        risk_level = "medium"
    else:
        risk_level = "low"

    # Generate prediction text
    text_map = {
        "critical": (
            f"⚠️ High disease vector risk detected at this location. "
            f"{species or 'Vector species'} larvae presence indicates active "
            f"breeding habitat. Public health monitoring recommended."
        ),
        "high": (
            f"Elevated disease vector risk at this location. "
            f"Environmental conditions may support vector breeding. "
            f"Continued monitoring advised."
        ),
        "medium": (
            "Moderate background risk. No immediate vector concern, "
            "but environmental conditions warrant periodic monitoring."
        ),
        "low": (
            "Low disease vector risk. Current species and environmental "
            "indicators suggest minimal public health concern at this site."
        ),
    }

    return {
        "risk_level": risk_level,
        "risk_probability": round(base_risk, 3),
        "prediction_text": text_map[risk_level],
        "model_version": "DipteraCAST-mock-v1",
        "factors": factors,
    }
