"""Pipeline Orchestrator — 3-stage parallel/sequential/conditional execution.

Coordinates all 7 agents in the correct execution order, yielding
Server-Sent Event (SSE) dicts as each agent completes for real-time
frontend display.

Stages:
  1. **Parallel** — Vision + Description + Metadata (fire simultaneously)
  2. **Sequential** — Quality Scorer (needs all Stage 1 outputs)
  3. **Conditional** — HIGH conf → FHIR + Impact | LOW conf → Brief + Impact

REF: DOC-05 Section 10
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, AsyncGenerator

from app.agents.description import run_description_agent
from app.agents.expert_brief import run_expert_brief_agent
from app.agents.fhir_translator import run_fhir_agent
from app.agents.impact import run_impact_agent
from app.agents.metadata import run_metadata_agent
from app.agents.quality import run_quality_agent
from app.agents.vision import run_vision_agent

logger = logging.getLogger(__name__)


async def run_pipeline(
    image_url: str,
    description: str,
    latitude: float,
    longitude: float,
    timestamp: str,
) -> AsyncGenerator[dict[str, Any], None]:
    """Run the full 7-agent pipeline with parallel execution.

    Yields status update dicts formatted as SSE events:

    - ``{"event": "stage", "data": {"stage": N, "status": "started"}}``
    - ``{"event": "agent_update", "data": {"agent": str, "status": str, "summary": str}}``
    - ``{"event": "pipeline_complete", "data": {...}}``

    Args:
        image_url: Public URL to the uploaded image.
        description: Volunteer's free-text description.
        latitude: GPS latitude.
        longitude: GPS longitude.
        timestamp: ISO-8601 observation timestamp.
    """
    pipeline_start = time.time()
    results: dict[str, Any] = {}

    # ── STAGE 1: Parallel data extraction ────────────────────────
    yield {"event": "stage", "data": {"stage": 1, "status": "started"}}

    vision_task = asyncio.create_task(run_vision_agent(image_url))
    description_task = asyncio.create_task(run_description_agent(description))
    metadata_task = asyncio.create_task(
        run_metadata_agent(latitude, longitude, timestamp)
    )

    # Map tasks → agent names for yielding updates
    pending = {
        vision_task: "vision",
        description_task: "description",
        metadata_task: "metadata",
    }

    for coro in asyncio.as_completed(pending.keys()):
        result = await coro
        # Find which task just completed
        agent_name = next(
            name for task, name in pending.items() if task.done() and task.result() is result
        )
        results[agent_name] = result
        yield {
            "event": "agent_update",
            "data": {
                "agent": agent_name,
                "status": result["status"],
                "summary": _summarize_agent(agent_name, result),
            },
        }

    yield {"event": "stage", "data": {"stage": 1, "status": "completed"}}

    # If vision identified a species, re-run metadata with species context
    top_species = results["vision"].get("top_species")
    if top_species:
        metadata_with_species = await run_metadata_agent(
            latitude, longitude, timestamp, species=top_species
        )
        results["metadata"] = metadata_with_species

    # ── STAGE 2: Sequential quality scoring ──────────────────────
    yield {"event": "stage", "data": {"stage": 2, "status": "started"}}

    results["quality"] = await run_quality_agent(
        vision_result=results["vision"],
        description_result=results["description"],
        metadata_result=results["metadata"],
    )

    score = results["quality"]["score"]
    routing = results["quality"]["routing"]

    yield {
        "event": "agent_update",
        "data": {
            "agent": "quality",
            "status": "success",
            "summary": f"Score: {score}/100 → {routing}",
        },
    }
    yield {"event": "stage", "data": {"stage": 2, "status": "completed"}}

    # ── STAGE 3: Conditional parallel execution ──────────────────
    yield {"event": "stage", "data": {"stage": 3, "status": "started"}}

    # Build impact input (used in both paths)
    vision_preds = results["vision"].get("predictions") or [{}]
    impact_input = {
        "species": results["vision"].get("top_species"),
        "common_name": vision_preds[0].get("common_name") if vision_preds else None,
        "confidence": results["vision"].get("top_confidence", 0),
        "quality_score": score,
        "routing": routing,
        "water_quality": results["vision"].get("water_quality_indication"),
        "is_disease_vector": results["vision"].get("is_disease_vector", False),
        "location_name": results["metadata"].get("pilot_city", "your area"),
        "description_params": results["description"].get("params", {}),
    }

    if routing == "auto_validate":
        # HIGH confidence path: FHIR + Impact in parallel
        fhir_task = asyncio.create_task(run_fhir_agent(results))
        impact_task = asyncio.create_task(run_impact_agent(impact_input))

        results["fhir"], results["impact"] = await asyncio.gather(
            fhir_task, impact_task
        )

        yield {
            "event": "agent_update",
            "data": {
                "agent": "fhir",
                "status": results["fhir"]["status"],
                "summary": f"FHIR resource: {results['fhir']['validation_status']}",
            },
        }
    else:
        # LOW confidence path: Expert Brief + Impact in parallel
        brief_task = asyncio.create_task(run_expert_brief_agent(results))
        impact_task = asyncio.create_task(run_impact_agent(impact_input))

        results["expert_brief"], results["impact"] = await asyncio.gather(
            brief_task, impact_task
        )

        yield {
            "event": "agent_update",
            "data": {
                "agent": "expert_brief",
                "status": results["expert_brief"]["status"],
                "summary": f"Priority: {results['expert_brief'].get('priority', '?')}",
            },
        }

    yield {
        "event": "agent_update",
        "data": {
            "agent": "impact",
            "status": results["impact"]["status"],
            "summary": results["impact"].get("headline", "Impact receipt generated"),
        },
    }

    yield {"event": "stage", "data": {"stage": 3, "status": "completed"}}

    # ── Pipeline complete ────────────────────────────────────────
    pipeline_time = round(time.time() - pipeline_start, 2)

    yield {
        "event": "pipeline_complete",
        "data": {
            "score": score,
            "routing": routing,
            "pipeline_time_seconds": pipeline_time,
            "results": results,
        },
    }

    logger.info(
        "Pipeline complete: score=%d routing=%s time=%.2fs",
        score,
        routing,
        pipeline_time,
    )


# ── SSE summary helpers ─────────────────────────────────────────


def _summarize_agent(name: str, result: dict[str, Any]) -> str:
    """Generate a short human-readable summary for SSE events and status polling."""
    if result.get("status") == "error":
        return f"{name.capitalize()} error: {str(result.get('error', 'check details'))[:60]}"

    if name == "vision":
        sp = result.get("top_species")
        conf = result.get("top_confidence", 0)
        wq = result.get("water_quality", {})
        clarity = wq.get("clarity", "monitored")
        if sp and conf > 0.3:
            return f"Found {sp} ({conf:.0%} conf) · {clarity.replace('_', ' ')} water"
        rating = wq.get("water_rating", "moderate")
        return f"{clarity.replace('_', ' ').capitalize()} water · {rating.replace('_', ' ')} status"
    elif name == "description":
        params = result.get("params", {})
        count = sum(1 for v in params.values() if v is not None)
        return f"{count} environmental parameters extracted"
    elif name == "metadata":
        anomalies = result.get("validation", {}).get("anomaly_count", 0)
        loc = result.get("pilot_city") or result.get("validation", {}).get("gps_location_name") or "Area"
        if anomalies == 0:
            return f"Verified near {loc} · No anomalies"
        return f"Flagged {anomalies} anomaly(ies) at {loc}"
    elif name == "quality":
        score = result.get("score", 0)
        routing = result.get("routing", "review")
        return f"Score {score}/100 · {routing.replace('_', ' ').title()}"
    elif name == "fhir":
        return f"FHIR R4 Observation resource generated ({result.get('validation_status', 'valid')})"
    elif name == "impact":
        return result.get("headline") or "Community health impact receipt created"
    elif name == "expert_brief":
        prio = result.get("priority", "medium")
        return f"Expert triage brief prepared ({prio} priority)"

    return "Complete"
