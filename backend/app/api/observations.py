"""Observation endpoints — CRUD + SSE pipeline streaming.

REF: DOC-04 Lines 352-416
"""

from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.orchestrator import run_pipeline
from app.database import get_session
from app.middleware.auth import get_current_user
from app.middleware.errors import ForbiddenError, NotFoundError
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.observation import (
    ObservationCreate,
    ObservationDetailResponse,
    ObservationListResponse,
    ObservationResponse,
    ObservationStatusResponse,
)
from app.schemas.ai_result import AIResultResponse
from app.schemas.review import ReviewResponse
from app.schemas.fhir import FHIRResourceResponse
from app.services import observation_service

router = APIRouter()


@router.post("", response_model=dict)
async def create_observation(
    data: ObservationCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Submit a new citizen science observation.

    Inserts the observation into the database with ``status=processing``
    and launches the 7-agent AI pipeline as a background task.

    Returns the created observation and a pipeline task identifier.
    """
    obs = await observation_service.create_observation(data, user, session)
    return {
        "observation": ObservationResponse.model_validate(obs),
        "pipeline_task_id": str(obs.id),
    }


@router.get("", response_model=ObservationListResponse)
async def list_observations(
    status: str | None = Query(None, description="Filter by observation status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List observations with pagination.

    **Volunteers** see only their own submissions.
    **Researchers** see all submissions across the platform.
    """
    observations, total = await observation_service.list_observations(
        session, user=user, status=status, page=page, limit=limit
    )
    return ObservationListResponse(
        observations=[ObservationResponse.model_validate(o) for o in observations],
        total=total,
        page=page,
    )


@router.get("/{observation_id}", response_model=ObservationDetailResponse)
async def get_observation(
    observation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get full observation detail including AI results, review, and FHIR resource."""
    obs = await observation_service.get_observation_detail(observation_id, session)
    if not obs:
        raise NotFoundError("Observation not found")

    # Scoped deletion check
    if user.role == UserRole.VOLUNTEER:
        if obs.user_id != user.id or obs.deleted_by_volunteer:
            raise NotFoundError("Observation not found")
    elif user.role == UserRole.RESEARCHER:
        if obs.deleted_by_researcher:
            raise NotFoundError("Observation not found")

    return ObservationDetailResponse(
        observation=ObservationResponse.model_validate(obs),
        ai_results=[AIResultResponse.model_validate(r) for r in obs.ai_results],
        review=ReviewResponse.model_validate(obs.review) if obs.review else None,
        fhir_resource=FHIRResourceResponse.model_validate(obs.fhir_resource)
        if obs.fhir_resource
        else None,
    )


@router.delete("/{observation_id}", status_code=204)
async def delete_observation(
    observation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Delete an observation adhering to scoped volunteer/researcher rules.

    - Volunteer deleting unvalidated observation: removes from volunteer AND researcher panel.
    - Volunteer deleting validated observation: removes from volunteer view, stays on researcher panel.
    - Researcher deleting observation: removes from researcher panel, preserves volunteer view.
    """
    await observation_service.delete_observation(observation_id, user, session)


@router.get("/{observation_id}/status", response_model=ObservationStatusResponse)
async def get_observation_status(
    observation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get pipeline processing status per agent (polling fallback)."""
    # Quick ownership and deletion check
    from app.models.observation import Observation

    obs = await session.get(Observation, observation_id)
    if not obs:
        raise NotFoundError("Observation not found")
    if user.role == UserRole.VOLUNTEER:
        if obs.user_id != user.id or obs.deleted_by_volunteer:
            raise NotFoundError("Observation not found")
    elif user.role == UserRole.RESEARCHER:
        if obs.deleted_by_researcher:
            raise NotFoundError("Observation not found")

    return await observation_service.get_observation_status(observation_id, session)


@router.get("/{observation_id}/stream")
async def stream_observation(
    observation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Stream pipeline execution events via Server-Sent Events (SSE).

    Returns a ``text/event-stream`` response that yields real-time
    updates as each AI agent completes processing.

    Events:
      - ``stage`` — Stage started/completed
      - ``agent_update`` — Individual agent result
      - ``pipeline_complete`` — All agents done, final results
    """
    from app.models.observation import Observation

    obs = await session.get(Observation, observation_id)
    if not obs:
        raise NotFoundError("Observation not found")

    if user.role == UserRole.VOLUNTEER and obs.user_id != user.id:
        raise ForbiddenError("Cannot access this observation")

    async def event_generator():
        try:
            async for event in run_pipeline(
                obs.image_url,
                obs.description or "",
                obs.latitude,
                obs.longitude,
                obs.observed_at.isoformat(),
            ):
                event_type = event.get("event", "message")
                data = json.dumps(event.get("data", {}))
                yield f"event: {event_type}\ndata: {data}\n\n"
        except Exception as exc:
            error_data = json.dumps({"error": str(exc)})
            yield f"event: error\ndata: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
