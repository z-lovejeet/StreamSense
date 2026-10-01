"""Tests for __init__.py exports — verifying the package API surface."""

from __future__ import annotations


def test_agents_package_exports():
    """All agent functions are importable from app.agents."""
    from app.agents import (
        fallback_quality_score,
        run_description_agent,
        run_expert_brief_agent,
        run_fhir_agent,
        run_impact_agent,
        run_metadata_agent,
        run_pipeline,
        run_quality_agent,
        run_vision_agent,
    )

    assert callable(run_pipeline)
    assert callable(run_vision_agent)
    assert callable(run_description_agent)
    assert callable(run_metadata_agent)
    assert callable(run_quality_agent)
    assert callable(fallback_quality_score)
    assert callable(run_fhir_agent)
    assert callable(run_impact_agent)
    assert callable(run_expert_brief_agent)


def test_prompts_package_exports():
    """All prompts are importable from app.agents.prompts."""
    from app.agents.prompts import (
        BMWP_SCORES,
        DESCRIPTION_SYSTEM_PROMPT,
        DISEASE_VECTOR_TAXA,
        EXPERT_BRIEF_SYSTEM_PROMPT,
        FHIR_TRANSLATOR_SYSTEM_PROMPT,
        IMPACT_SYSTEM_PROMPT,
        METADATA_SYSTEM_PROMPT,
        QUALITY_SYSTEM_PROMPT,
        TARGET_TAXA,
        TAXA_COMMON_NAMES,
        get_quality_indication,
    )

    assert len(TARGET_TAXA) == 15
    assert len(DESCRIPTION_SYSTEM_PROMPT) > 100
    assert len(METADATA_SYSTEM_PROMPT) > 100
    assert len(QUALITY_SYSTEM_PROMPT) > 100
    assert len(FHIR_TRANSLATOR_SYSTEM_PROMPT) > 100
    assert len(IMPACT_SYSTEM_PROMPT) > 100
    assert len(EXPERT_BRIEF_SYSTEM_PROMPT) > 100


def test_utils_package_exports():
    """All utilities are importable from app.utils."""
    from app.utils import (
        check_gbif_occurrence,
        get_weather,
        is_near_water,
        reverse_geocode,
    )

    assert callable(reverse_geocode)
    assert callable(is_near_water)
    assert callable(check_gbif_occurrence)
    assert callable(get_weather)
