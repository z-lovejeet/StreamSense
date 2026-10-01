"""Tests for individual agent functions — fallbacks, edge cases, output structure.

These tests do NOT call external APIs (Groq/Gemini/BioCLIP).  They verify:
  - Deterministic fallback scoring (quality agent)
  - Description agent handles empty input
  - Output structure contracts
  - FHIR demo resource validation
  - Impact fallback template
  - Expert brief raw fallback
"""

from __future__ import annotations

import pytest


# ──────────────────────────────────────────────────────────────────
# Agent 2: Description — empty input handling
# ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_description_agent_empty_input():
    """Description agent returns 'skipped' for empty text."""
    from app.agents.description import run_description_agent

    result = await run_description_agent("")
    assert result["agent"] == "description"
    assert result["status"] == "skipped"
    assert result["params"] == {}
    assert result["confidence"] == "low"


@pytest.mark.asyncio
async def test_description_agent_none_input():
    """Description agent returns 'skipped' for None."""
    from app.agents.description import run_description_agent

    result = await run_description_agent(None)
    assert result["status"] == "skipped"


# ──────────────────────────────────────────────────────────────────
# Agent 4: Quality — deterministic fallback
# ──────────────────────────────────────────────────────────────────


class TestFallbackQualityScore:
    """Test the rule-based 40/35/25 deterministic fallback scorer."""

    def test_perfect_score(
        self, sample_vision_success, sample_description_success, sample_metadata_valid
    ):
        from app.agents.quality import fallback_quality_score

        result = fallback_quality_score(
            sample_vision_success, sample_description_success, sample_metadata_valid
        )
        assert result["score"] == 100
        assert result["routing"] == "auto_validate"

    def test_low_confidence_routes_to_expert(
        self, sample_vision_low_conf, sample_description_empty, sample_metadata_suspicious
    ):
        from app.agents.quality import fallback_quality_score

        result = fallback_quality_score(
            sample_vision_low_conf, sample_description_empty, sample_metadata_suspicious
        )
        assert result["score"] < 70
        assert result["routing"] == "expert_review"

    def test_vision_error_caps_score(
        self, sample_vision_error, sample_description_success, sample_metadata_valid
    ):
        from app.agents.quality import fallback_quality_score

        result = fallback_quality_score(
            sample_vision_error, sample_description_success, sample_metadata_valid
        )
        # Vision error → 5 pts, valid meta → 35, high desc → 25 = 65
        assert result["score"] < 70
        assert result["routing"] == "expert_review"

    def test_invalid_metadata(
        self, sample_vision_success, sample_description_success, sample_metadata_invalid
    ):
        from app.agents.quality import fallback_quality_score

        result = fallback_quality_score(
            sample_vision_success, sample_description_success, sample_metadata_invalid
        )
        # Good vision (40) + invalid meta (0) + good desc (25) = 65
        assert result["score"] < 70
        assert result["routing"] == "expert_review"

    def test_all_terrible(
        self, sample_vision_error, sample_description_empty, sample_metadata_invalid
    ):
        from app.agents.quality import fallback_quality_score

        result = fallback_quality_score(
            sample_vision_error, sample_description_empty, sample_metadata_invalid
        )
        # 5 + 0 + 5 = 10
        assert result["score"] == 10
        assert result["routing"] == "expert_review"

    def test_output_structure(
        self, sample_vision_success, sample_description_success, sample_metadata_valid
    ):
        from app.agents.quality import fallback_quality_score

        result = fallback_quality_score(
            sample_vision_success, sample_description_success, sample_metadata_valid
        )
        assert "score" in result
        assert "routing" in result
        assert "reasoning" in result
        assert "score_breakdown" in result
        assert "key_strengths" in result
        assert "key_concerns" in result
        assert "recommended_action" in result


# ──────────────────────────────────────────────────────────────────
# Agent 5: FHIR — demo resource validation
# ──────────────────────────────────────────────────────────────────


class TestFHIRValidation:
    """Test FHIR resource validation and demo fallback."""

    def test_demo_observation_validates(self):
        from app.agents.fhir_translator import DEMO_FHIR_OBSERVATION
        from app.services.fhir_service import validate_observation

        is_valid, result = validate_observation(DEMO_FHIR_OBSERVATION)
        assert is_valid, f"Demo FHIR resource failed validation: {result}"

    def test_invalid_observation_fails(self):
        from app.services.fhir_service import validate_observation

        is_valid, error = validate_observation({"resourceType": "Observation"})
        assert not is_valid
        assert error is not None

    def test_bundle_generation(self):
        from app.agents.fhir_translator import DEMO_FHIR_OBSERVATION
        from app.services.fhir_service import generate_fhir_bundle

        bundle = generate_fhir_bundle([DEMO_FHIR_OBSERVATION])
        assert bundle["resourceType"] == "Bundle"
        assert bundle["type"] == "transaction"
        assert len(bundle["entry"]) == 1
        assert bundle["entry"][0]["request"]["method"] == "POST"


# ──────────────────────────────────────────────────────────────────
# Agent 6: Impact — fallback template
# ──────────────────────────────────────────────────────────────────


class TestImpactFallback:
    """Test that the impact fallback template has all required fields."""

    def test_fallback_has_required_fields(self):
        from app.agents.impact import _FALLBACK_IMPACT

        assert "impact_text" in _FALLBACK_IMPACT
        assert "headline" in _FALLBACK_IMPACT
        assert "ecological_insight" in _FALLBACK_IMPACT
        assert "health_connection" in _FALLBACK_IMPACT
        assert len(_FALLBACK_IMPACT["impact_text"]) > 20


# ──────────────────────────────────────────────────────────────────
# Agent 7: Expert Brief — raw fallback
# ──────────────────────────────────────────────────────────────────


class TestExpertBriefFallback:
    """Test the raw output fallback for expert brief."""

    def test_raw_fallback_structure(
        self, sample_vision_success, sample_description_success, sample_metadata_valid
    ):
        from app.agents.expert_brief import _raw_fallback

        all_results = {
            "vision": sample_vision_success,
            "description": sample_description_success,
            "metadata": sample_metadata_valid,
            "quality": {"score": 45, "routing": "expert_review"},
        }

        result = _raw_fallback(all_results)
        assert result["agent"] == "expert_brief"
        assert result["status"] == "fallback"
        assert "summary" in result
        assert "concerns" in result
        assert len(result["concerns"]) > 0
        assert result["recommended_action"] == "requires_careful_review"


# ──────────────────────────────────────────────────────────────────
# Vision config / prompts
# ──────────────────────────────────────────────────────────────────


class TestVisionConfig:
    """Test the curated taxa list and helper functions."""

    def test_taxa_count(self):
        from app.agents.prompts.vision_config import TARGET_TAXA

        assert len(TARGET_TAXA) == 15

    def test_all_taxa_have_common_names(self):
        from app.agents.prompts.vision_config import TARGET_TAXA, TAXA_COMMON_NAMES

        for taxon in TARGET_TAXA:
            assert taxon in TAXA_COMMON_NAMES, f"Missing common name for {taxon}"

    def test_all_taxa_have_bmwp_scores(self):
        from app.agents.prompts.vision_config import TARGET_TAXA, BMWP_SCORES

        for taxon in TARGET_TAXA:
            assert taxon in BMWP_SCORES, f"Missing BMWP score for {taxon}"

    def test_quality_indication(self):
        from app.agents.prompts.vision_config import get_quality_indication

        assert get_quality_indication("Ephemeroptera") == "good"
        assert get_quality_indication("Baetidae") == "moderate"
        assert get_quality_indication("Chironomidae") == "poor"
        assert get_quality_indication("Culicidae") == "disease_vector"
        assert get_quality_indication("UnknownTaxon") == "unknown"

    def test_disease_vectors(self):
        from app.agents.prompts.vision_config import DISEASE_VECTOR_TAXA

        assert "Culicidae" in DISEASE_VECTOR_TAXA
        assert "Simuliidae" in DISEASE_VECTOR_TAXA
        assert "Ephemeroptera" not in DISEASE_VECTOR_TAXA


# ──────────────────────────────────────────────────────────────────
# DipteraCAST mock
# ──────────────────────────────────────────────────────────────────


class TestDipteraCAST:

    @pytest.mark.asyncio
    async def test_disease_vector_high_risk(self):
        from app.services.dipteracast_mock import predict_disease_vector

        result = await predict_disease_vector(
            40.2, -8.4, temperature_c=28.0, species="Culicidae", is_disease_vector=True
        )
        assert result["risk_level"] in ("high", "critical")

    @pytest.mark.asyncio
    async def test_non_vector_cold_low_risk(self):
        from app.services.dipteracast_mock import predict_disease_vector

        result = await predict_disease_vector(
            40.2, -8.4, temperature_c=8.0, species="Ephemeroptera", is_disease_vector=False
        )
        assert result["risk_level"] == "low"

    @pytest.mark.asyncio
    async def test_output_structure(self):
        from app.services.dipteracast_mock import predict_disease_vector

        result = await predict_disease_vector(40.2, -8.4)
        assert "risk_level" in result
        assert "risk_probability" in result
        assert "prediction_text" in result
        assert "model_version" in result
        assert "factors" in result


# ──────────────────────────────────────────────────────────────────
# Metadata helpers
# ──────────────────────────────────────────────────────────────────


class TestMetadataHelpers:

    def test_pilot_city_coimbra(self):
        from app.agents.metadata import _check_pilot_city

        assert _check_pilot_city(40.2033, -8.4103) == "Coimbra"

    def test_pilot_city_oslo(self):
        from app.agents.metadata import _check_pilot_city

        assert _check_pilot_city(59.9139, 10.7522) == "Oslo"

    def test_pilot_city_none(self):
        from app.agents.metadata import _check_pilot_city

        assert _check_pilot_city(0.0, 0.0) is None

    def test_haversine(self):
        from app.agents.metadata import _haversine

        # Coimbra to Toulouse is ~900 km
        dist = _haversine(40.2033, -8.4103, 43.6047, 1.4442)
        assert 850 < dist < 950
