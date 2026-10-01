"""Groq API client with cascading model fallback.

Wraps ``groq.AsyncGroq`` and walks through the configured model list
(primary → fallback_1 → fallback_2) when a request fails or is
rate-limited.

Usage::

    from app.services.groq_client import groq

    text = await groq.chat(
        system="You are a description parser…",
        user="Extract parameters from: …",
    )
"""

from __future__ import annotations

import json
import logging
from typing import Any

from groq import AsyncGroq

from app.agents.base import AllModelsExhaustedError
from app.config import settings

logger = logging.getLogger(__name__)


class GroqClient:
    """Cascading Groq client with automatic model fallback."""

    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._models: list[str] = [
            settings.groq_model_primary,      # qwen/qwen3.8-27b
            settings.groq_model_fallback_1,   # openai/gpt-oss-120b
            settings.groq_model_fallback_2,   # openai/gpt-oss-20b
        ]

    async def chat(
        self,
        system: str,
        user: str,
        *,
        json_mode: bool = True,
        temperature: float = 0.1,
        max_tokens: int = 500,
    ) -> str:
        """Send a chat completion through the model cascade.

        Returns the raw assistant message content from the first model
        that succeeds.

        Parameters
        ----------
        json_mode:
            If ``True`` **and** the current model is the primary
            (``qwen/qwen3.8-27b``), sets ``response_format`` to
            ``{"type": "json_object"}``.  Fallback models don't
            support JSON mode — the prompt is relied upon instead.
        """
        errors: list[str] = []

        for model in self._models:
            try:
                kwargs: dict[str, Any] = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }

                # Only the primary model supports native JSON mode
                if json_mode and model == settings.groq_model_primary:
                    kwargs["response_format"] = {"type": "json_object"}

                response = await self._client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content
                logger.debug("Groq %-28s  OK", model)
                return content

            except Exception as exc:  # noqa: BLE001
                errors.append(f"{model}: {exc!r}")
                logger.warning("Groq model %s failed: %s", model, exc)
                continue

        raise AllModelsExhaustedError("Groq")

    async def chat_json(
        self,
        system: str,
        user: str,
        **kwargs: Any,
    ) -> dict:
        """Convenience wrapper: calls ``chat`` and ``json.loads`` the result."""
        text = await self.chat(system, user, json_mode=True, **kwargs)
        return json.loads(text)


# ── Module-level singleton ───────────────────────────────────────
groq = GroqClient()
