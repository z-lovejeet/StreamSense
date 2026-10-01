"""Gemini API client with cascading model chain and per-model RPD rate limiting.

Uses the ``google-genai`` SDK (``google.genai``).  The chain walks through
models in order; when a model's daily request count hits its RPD limit the
client automatically falls through to the next model.  Counts reset at
midnight UTC.

Usage::

    from app.services.gemini_client import gemini

    text = await gemini.generate(
        prompt="Evaluate this observation…",
        system="You are a quality scoring agent…",
    )
"""

from __future__ import annotations

import json
import logging
from datetime import date, timezone, datetime
from typing import Any

from google import genai
from google.genai.types import GenerateContentConfig

from app.agents.base import AllModelsExhaustedError
from app.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    """Rate-limited cascading Gemini client."""

    def __init__(self) -> None:
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._chain: list[str] = settings.gemini_model_chain
        self._counts: dict[str, int] = {m: 0 for m in self._chain}
        self._last_reset: date = datetime.now(timezone.utc).date()

    # ── RPD helpers ──────────────────────────────────────────────

    def _rpd_for(self, model: str) -> int:
        """Return the RPD ceiling for *model*."""
        if "lite" in model:
            return settings.gemini_rpd_lite      # 500
        return settings.gemini_rpd_non_lite      # 16

    def _maybe_reset(self) -> None:
        today = datetime.now(timezone.utc).date()
        if today != self._last_reset:
            self._counts = {m: 0 for m in self._chain}
            self._last_reset = today

    def _can_use(self, model: str) -> bool:
        return self._counts.get(model, 0) < self._rpd_for(model)

    def _record(self, model: str) -> None:
        self._counts[model] = self._counts.get(model, 0) + 1
        logger.debug(
            "gemini %-28s  %d / %d RPD",
            model,
            self._counts[model],
            self._rpd_for(model),
        )

    # ── Public API ───────────────────────────────────────────────

    async def generate(
        self,
        prompt: str,
        system: str,
        *,
        json_mode: bool = True,
        temperature: float = 0.1,
        max_output_tokens: int = 2048,
    ) -> str:
        """Send *prompt* with *system* instruction through the model chain.

        Returns the raw text content of the first successful response.
        Raises ``AllModelsExhaustedError`` if every model in the chain
        either hit its RPD limit or raised an exception.
        """
        self._maybe_reset()
        errors: list[str] = []

        for model in self._chain:
            if not self._can_use(model):
                errors.append(f"{model}: RPD exhausted")
                continue

            try:
                config = GenerateContentConfig(
                    system_instruction=system,
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                )
                if json_mode:
                    config.response_mime_type = "application/json"

                response = await self._client.aio.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                self._record(model)
                return response.text

            except Exception as exc:  # noqa: BLE001
                errors.append(f"{model}: {exc!r}")
                logger.warning("Gemini model %s failed: %s", model, exc)
                continue

        raise AllModelsExhaustedError("Gemini")

    async def generate_json(
        self,
        prompt: str,
        system: str,
        **kwargs: Any,
    ) -> dict:
        """Convenience wrapper: calls ``generate`` and ``json.loads`` the result."""
        text = await self.generate(prompt, system, json_mode=True, **kwargs)
        return json.loads(text)

    @property
    def status(self) -> dict[str, dict[str, int]]:
        """Snapshot of per-model usage.  Useful for health-check endpoints."""
        self._maybe_reset()
        return {
            m: {"used": self._counts[m], "limit": self._rpd_for(m)}
            for m in self._chain
        }


# ── Module-level singleton ───────────────────────────────────────
gemini = GeminiClient()
