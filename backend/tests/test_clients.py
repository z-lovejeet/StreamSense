"""Tests for the Gemini and Groq client wrappers — rate limiting, cascading."""

from __future__ import annotations

import pytest
from app.agents.base import AllModelsExhaustedError


class TestGeminiClient:
    """Test Gemini cascading client rate-limit logic (no API calls)."""

    def test_chain_loads_from_config(self):
        from app.services.gemini_client import gemini

        assert len(gemini._chain) >= 2
        assert "lite" in gemini._chain[0]  # dev chain starts with lite

    def test_rpd_limits(self):
        from app.services.gemini_client import gemini

        for model in gemini._chain:
            rpd = gemini._rpd_for(model)
            if "lite" in model:
                assert rpd == 500
            else:
                assert rpd == 16

    def test_can_use_when_fresh(self):
        from app.services.gemini_client import gemini

        # Reset counts
        gemini._counts = {m: 0 for m in gemini._chain}
        for model in gemini._chain:
            assert gemini._can_use(model)

    def test_cannot_use_when_exhausted(self):
        from app.services.gemini_client import gemini

        model = gemini._chain[0]
        limit = gemini._rpd_for(model)
        gemini._counts[model] = limit
        assert not gemini._can_use(model)
        # Reset
        gemini._counts[model] = 0

    def test_status_snapshot(self):
        from app.services.gemini_client import gemini

        status = gemini.status
        for model in gemini._chain:
            assert model in status
            assert "used" in status[model]
            assert "limit" in status[model]


class TestGroqClient:
    """Test Groq cascading client config (no API calls)."""

    def test_models_loaded(self):
        from app.services.groq_client import groq

        assert len(groq._models) == 3
        assert "qwen" in groq._models[0]

    def test_primary_model(self):
        from app.services.groq_client import groq
        from app.config import settings

        assert groq._models[0] == settings.groq_model_primary
