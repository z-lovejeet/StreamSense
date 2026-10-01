"""StreamSense base agent types and exceptions — shared across all 7 agents."""

from __future__ import annotations

from typing import Any, TypedDict


class AgentResult(TypedDict, total=False):
    """Minimum contract every agent must return."""

    agent: str
    status: str          # "success" | "error" | "skipped"
    error: str | None


class AgentError(Exception):
    """Raised when an agent encounters a non-recoverable error."""

    def __init__(self, agent: str, message: str) -> None:
        self.agent = agent
        super().__init__(f"[{agent}] {message}")


class AgentTimeoutError(AgentError):
    """Raised when an agent exceeds its timeout."""

    def __init__(self, agent: str, timeout_seconds: float) -> None:
        super().__init__(agent, f"Timed out after {timeout_seconds}s")


class AllModelsExhaustedError(Exception):
    """Raised when all models in a cascade have been exhausted."""

    def __init__(self, provider: str) -> None:
        self.provider = provider
        super().__init__(f"All {provider} models exhausted (rate-limited or errored)")
