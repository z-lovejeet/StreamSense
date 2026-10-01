"""conftest.py — shared pytest fixtures for StreamSense backend tests."""

from __future__ import annotations

import pytest


@pytest.fixture()
def sample_vision_success() -> dict:
    """A realistic successful vision agent result."""
    return {
        "agent": "vision",
        "status": "success",
        "predictions": [
            {"taxon": "Ephemeroptera", "confidence": 0.89, "common_name": "Mayfly nymph", "bmwp_score": 10},
            {"taxon": "Trichoptera", "confidence": 0.07, "common_name": "Caddisfly larva", "bmwp_score": 8},
        ],
        "top_species": "Ephemeroptera",
        "top_confidence": 0.89,
        "bmwp_score": 10,
        "water_quality_indication": "good",
        "is_disease_vector": False,
        "error": None,
    }


@pytest.fixture()
def sample_vision_low_conf() -> dict:
    """A low-confidence vision agent result."""
    return {
        "agent": "vision",
        "status": "success",
        "predictions": [
            {"taxon": "Chironomidae", "confidence": 0.25, "common_name": "Midge larva", "bmwp_score": 2},
        ],
        "top_species": "Chironomidae",
        "top_confidence": 0.25,
        "bmwp_score": 2,
        "water_quality_indication": "poor",
        "is_disease_vector": False,
        "error": None,
    }


@pytest.fixture()
def sample_vision_error() -> dict:
    """A failed vision agent result."""
    return {
        "agent": "vision",
        "status": "error",
        "predictions": [],
        "top_species": None,
        "top_confidence": 0,
        "bmwp_score": 0,
        "water_quality_indication": "unknown",
        "is_disease_vector": False,
        "error": "Connection timeout",
    }


@pytest.fixture()
def sample_description_success() -> dict:
    """A realistic successful description agent result."""
    return {
        "agent": "description",
        "status": "success",
        "params": {
            "water_color": "clear",
            "water_clarity": "transparent",
            "flow_speed": "moderate",
            "odor": "none",
            "debris": "none",
            "organisms_mentioned": ["small insects"],
            "overall_impression": "healthy",
            "confidence_in_extraction": "high",
        },
        "confidence": "high",
        "error": None,
    }


@pytest.fixture()
def sample_description_empty() -> dict:
    """A skipped description agent result (no description provided)."""
    return {
        "agent": "description",
        "status": "skipped",
        "params": {},
        "confidence": "low",
        "error": "No description provided",
    }


@pytest.fixture()
def sample_metadata_valid() -> dict:
    """A valid metadata agent result (no anomalies)."""
    return {
        "agent": "metadata",
        "status": "success",
        "validation": {
            "gps_valid": True,
            "gps_near_water": True,
            "gps_location_name": "Madrigueira stream, Coimbra",
            "gps_in_pilot_city": True,
            "gps_anomaly": None,
            "timestamp_valid": True,
            "timestamp_anomaly": None,
            "overall_validity": "valid",
            "anomalies": [],
            "anomaly_count": 0,
            "confidence": "high",
        },
        "pilot_city": "Coimbra",
        "error": None,
    }


@pytest.fixture()
def sample_metadata_suspicious() -> dict:
    """A suspicious metadata agent result (anomalies found)."""
    return {
        "agent": "metadata",
        "status": "success",
        "validation": {
            "gps_valid": True,
            "gps_near_water": False,
            "gps_location_name": "Shopping mall parking lot",
            "gps_in_pilot_city": True,
            "gps_anomaly": "GPS is 500m from nearest water body",
            "timestamp_valid": True,
            "timestamp_anomaly": None,
            "overall_validity": "suspicious",
            "anomalies": ["GPS is 500m from nearest water body"],
            "anomaly_count": 1,
            "confidence": "medium",
        },
        "pilot_city": "Coimbra",
        "error": None,
    }


@pytest.fixture()
def sample_metadata_invalid() -> dict:
    """An invalid metadata agent result."""
    return {
        "agent": "metadata",
        "status": "success",
        "validation": {
            "gps_valid": False,
            "overall_validity": "invalid",
            "anomalies": ["GPS in the ocean", "Timestamp from the future"],
            "anomaly_count": 2,
        },
        "pilot_city": None,
        "error": None,
    }
