"""Review endpoints — expert review queue and action processing.

REF: DOC-04 Lines 361-368
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import require_role
from app.models.user import User
from app.schemas.fhir import FHIRResourceResponse
from app.schemas.observation import ObservationListResponse, ObservationResponse
from app.schemas.review import ReviewCreate
from app.services import review_service

router = APIRouter()


@router.get("/queue", response_model=ObservationListResponse)
async def get_review_queue(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    species: str | None = Query(None, description="Filter by species"),
    min_score: int | None = Query(None, ge=0, le=100, description="Minimum confidence score"),
    max_score: int | None = Query(None, ge=0, le=100, description="Maximum confidence score"),
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Get observations pending expert review.

    Supports filtering by species and confidence score range.
    Ordered by creation date (newest first).
    """
    observations, total = await review_service.get_review_queue(
        session,
        page=page,
        limit=limit,
        species=species,
        min_score=min_score,
        max_score=max_score,
    )
    return ObservationListResponse(
        observations=[ObservationResponse.model_validate(o) for o in observations],
        total=total,
        page=page,
    )


@router.get("/queue/count")
async def get_queue_count(
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Get count of observations pending expert review.

    Lightweight endpoint for dashboard polling (every 30 seconds).
    """
    count = await review_service.get_queue_count(session)
    return {"count": count}


@router.post("/{observation_id}/action")
async def process_review_action(
    observation_id: uuid.UUID,
    action_data: ReviewCreate,
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Submit expert review decision for an observation.

    Actions:
      - **confirm**: Accept as-is → triggers FHIR export + impact receipt
      - **correct**: Accept with corrections → applies corrections + FHIR + impact
      - **reject**: Reject → records reason + notifies volunteer

    Returns 409 CONFLICT if observation has already been reviewed.
    """
    result = await review_service.process_review_action(
        observation_id, user, action_data, session
    )

    response: dict = {
        "observation": ObservationResponse.model_validate(result["observation"]),
    }
    if result.get("fhir_resource"):
        response["fhir_resource"] = FHIRResourceResponse.model_validate(
            result["fhir_resource"]
        )

    return response
