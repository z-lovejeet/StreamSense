"""Observation service — business logic for observations.

Handles creation, retrieval, and pipeline execution.  The service layer
sits between API routes and the database/agent layer.

REF: DOC-04, DOC-05 §10
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.orchestrator import run_pipeline
from app.database import async_session
from app.models.ai_result import AIResult
from app.models.enums import ObservationStatus
from app.models.fhir_resource import FHIRResource
from app.models.notification import Notification
from app.models.observation import Observation
from app.models.user import User
from app.schemas.observation import (
    ObservationCreate,
    ObservationDetailResponse,
    ObservationListResponse,
    ObservationResponse,
    ObservationStatusResponse,
    AgentStatus,
)

logger = logging.getLogger(__name__)


async def create_observation(
    data: ObservationCreate,
    user: User,
    session: AsyncSession,
) -> Observation:
    """Create a new observation and launch the AI pipeline.

    Inserts the observation row with status=processing, then kicks off
    the pipeline as a background asyncio task.
    """
    observation = Observation(
        id=uuid.uuid4(),
        user_id=user.id,
        image_url=data.image_url,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        observed_at=data.timestamp,
        status=ObservationStatus.PROCESSING,
    )
    session.add(observation)
    await session.commit()
    await session.refresh(observation)

    # Launch pipeline as a background task (fire-and-forget)
    asyncio.create_task(
        _run_pipeline_task(
            observation_id=observation.id,
            image_url=data.image_url,
            description=data.description or "",
            latitude=data.latitude,
            longitude=data.longitude,
            timestamp=data.timestamp.isoformat(),
        )
    )

    return observation


async def get_observation_detail(
    observation_id: uuid.UUID,
    session: AsyncSession,
) -> Observation | None:
    """Get a single observation with all related data eagerly loaded."""
    result = await session.execute(
        select(Observation)
        .options(
            selectinload(Observation.ai_results),
            selectinload(Observation.review),
            selectinload(Observation.fhir_resource),
        )
        .where(Observation.id == observation_id)
    )
    return result.scalar_one_or_none()


async def list_observations(
    session: AsyncSession,
    *,
    user: User | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Observation], int]:
    """List observations with pagination and optional filters.

    If ``user`` is provided and their role is volunteer, only their own
    observations are returned.
    """
    query = select(Observation)
    count_query = select(func.count(Observation.id))

    # Role-based filtering
    if user and user.role.value == "volunteer":
        query = query.where(Observation.user_id == user.id)
        count_query = count_query.where(Observation.user_id == user.id)

    # Status filter
    if status:
        query = query.where(Observation.status == status)
        count_query = count_query.where(Observation.status == status)

    # Total count
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Paginated results
    offset = (page - 1) * limit
    query = query.order_by(Observation.created_at.desc()).offset(offset).limit(limit)

    result = await session.execute(query)
    observations = list(result.scalars().all())

    return observations, total


async def get_observation_status(
    observation_id: uuid.UUID,
    session: AsyncSession,
) -> ObservationStatusResponse:
    """Get pipeline processing status for an observation."""
    observation = await session.get(Observation, observation_id)
    if not observation:
        from app.middleware.errors import NotFoundError
        raise NotFoundError("Observation not found")

    # Fetch AI results for this observation
    result = await session.execute(
        select(AIResult)
        .where(AIResult.observation_id == observation_id)
        .order_by(AIResult.created_at)
    )
    ai_results = list(result.scalars().all())

    # Build agent status list
    all_agents = ["vision", "description", "metadata", "quality", "fhir", "impact", "expert_brief"]
    completed_agents = {r.agent_name: r.status for r in ai_results}

    agent_statuses = []
    for agent in all_agents:
        if agent in completed_agents:
            agent_statuses.append(AgentStatus(agent=agent, status=completed_agents[agent]))
        elif observation.status == ObservationStatus.PROCESSING:
            agent_statuses.append(AgentStatus(agent=agent, status="pending"))
        # Skip agents that weren't run (e.g., expert_brief when auto_validated)

    return ObservationStatusResponse(
        status=observation.status.value if isinstance(observation.status, ObservationStatus) else str(observation.status),
        agent_statuses=agent_statuses,
    )


# ── Background pipeline task ────────────────────────────────────


async def _run_pipeline_task(
    observation_id: uuid.UUID,
    image_url: str,
    description: str,
    latitude: float,
    longitude: float,
    timestamp: str,
) -> None:
    """Run the 7-agent pipeline and persist all results to the database.

    This runs as a background asyncio task — not inside a request context.
    Uses its own database session.
    """
    async with async_session() as session:
        try:
            async for event in run_pipeline(
                image_url, description, latitude, longitude, timestamp
            ):
                if event["event"] == "agent_update":
                    agent_data = event["data"]
                    ai_result = AIResult(
                        observation_id=observation_id,
                        agent_name=agent_data["agent"],
                        agent_version="1.0",
                        model_used=agent_data.get("model", "unknown"),
                        status=agent_data["status"],
                        result=agent_data,
                    )
                    session.add(ai_result)
                    await session.flush()

                elif event["event"] == "pipeline_complete":
                    data = event["data"]
                    results = data["results"]

                    # Update observation with final results
                    obs = await session.get(Observation, observation_id)
                    if not obs:
                        logger.error("Observation %s not found after pipeline", observation_id)
                        return

                    obs.status = (
                        ObservationStatus.AUTO_VALIDATED
                        if data["routing"] == "auto_validate"
                        else ObservationStatus.PENDING_REVIEW
                    )
                    obs.confidence_score = data["score"]
                    obs.routing = data["routing"]
                    obs.pipeline_time_seconds = data["pipeline_time_seconds"]

                    # Vision results
                    vision = results.get("vision", {})
                    obs.top_species = vision.get("top_species")
                    obs.top_confidence = vision.get("top_confidence")

                    # Impact results
                    impact = results.get("impact", {})
                    obs.impact_text = impact.get("impact_text")
                    obs.impact_headline = impact.get("headline")

                    # Location from metadata
                    metadata = results.get("metadata", {})
                    validation = metadata.get("validation", {})
                    obs.location_name = validation.get("gps_location_name")
                    obs.pilot_city = metadata.get("pilot_city")

                    # Persist FHIR resource if generated
                    fhir = results.get("fhir")
                    if fhir and fhir.get("resource_json"):
                        fhir_row = FHIRResource(
                            observation_id=observation_id,
                            resource_type="Observation",
                            profile_url="http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah",
                            resource_json=fhir["resource_json"],
                            validation_status=fhir.get("validation_status", "unknown"),
                            sandbox_status=fhir.get("sandbox_status", "pending"),
                            sandbox_id=fhir.get("sandbox_id"),
                        )
                        session.add(fhir_row)

                    obs.updated_at = datetime.now(timezone.utc)

            await session.commit()

            # Create notification for the volunteer
            async with async_session() as notify_session:
                obs = await notify_session.get(Observation, observation_id)
                if obs:
                    title = (
                        "Observation auto-validated!"
                        if obs.status == ObservationStatus.AUTO_VALIDATED
                        else "Observation submitted for expert review"
                    )
                    message = (
                        f"Your stream observation scored {obs.confidence_score}/100. "
                        f"{'It has been automatically validated.' if obs.status == ObservationStatus.AUTO_VALIDATED else 'A researcher will review it shortly.'}"
                    )
                    notification = Notification(
                        user_id=obs.user_id,
                        type="pipeline_complete",
                        title=title,
                        message=message,
                        observation_id=observation_id,
                    )
                    notify_session.add(notification)
                    await notify_session.commit()

            logger.info(
                "Pipeline complete for observation %s: score=%s routing=%s",
                observation_id,
                data.get("score"),
                data.get("routing"),
            )

        except Exception as exc:
            logger.exception(
                "Pipeline failed for observation %s: %s", observation_id, exc
            )
            try:
                obs = await session.get(Observation, observation_id)
                if obs:
                    obs.pipeline_error = str(exc)[:500]
                    obs.updated_at = datetime.now(timezone.utc)
                    await session.commit()
            except Exception:
                logger.exception("Failed to record pipeline error")
