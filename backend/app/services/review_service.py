"""Review service — expert review queue and action processing.

REF: DOC-04 Lines 361-368, 266-281
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.fhir_translator import run_fhir_agent
from app.agents.impact import run_impact_agent
from app.middleware.errors import ConflictError, NotFoundError
from app.models.enums import ObservationStatus, ReviewAction
from app.models.expert_review import ExpertReview
from app.models.fhir_resource import FHIRResource
from app.models.notification import Notification
from app.models.observation import Observation
from app.models.user import User
from app.schemas.review import ReviewCreate

logger = logging.getLogger(__name__)


async def get_review_queue(
    session: AsyncSession,
    *,
    page: int = 1,
    limit: int = 20,
    species: str | None = None,
    min_score: int | None = None,
    max_score: int | None = None,
) -> tuple[list[Observation], int]:
    """Get observations pending expert review with optional filters."""
    query = select(Observation).where(
        Observation.status == ObservationStatus.PENDING_REVIEW
    )
    count_query = select(func.count(Observation.id)).where(
        Observation.status == ObservationStatus.PENDING_REVIEW
    )

    if species:
        query = query.where(Observation.top_species == species)
        count_query = count_query.where(Observation.top_species == species)

    if min_score is not None:
        query = query.where(Observation.confidence_score >= min_score)
        count_query = count_query.where(Observation.confidence_score >= min_score)

    if max_score is not None:
        query = query.where(Observation.confidence_score <= max_score)
        count_query = count_query.where(Observation.confidence_score <= max_score)

    # Total count
    total = (await session.execute(count_query)).scalar() or 0

    # Paginated results
    offset = (page - 1) * limit
    query = query.order_by(Observation.created_at.desc()).offset(offset).limit(limit)
    observations = list((await session.execute(query)).scalars().all())

    return observations, total


async def get_queue_count(session: AsyncSession) -> int:
    """Get count of observations pending expert review."""
    result = await session.execute(
        select(func.count(Observation.id)).where(
            Observation.status == ObservationStatus.PENDING_REVIEW
        )
    )
    return result.scalar() or 0


async def process_review_action(
    observation_id: uuid.UUID,
    reviewer: User,
    action_data: ReviewCreate,
    session: AsyncSession,
) -> dict[str, Any]:
    """Process an expert review action (confirm/correct/reject).

    - **confirm/correct**: Sets status to ``expert_validated``, runs
      FHIR translator (Agent 5) + Impact generator (Agent 6), creates
      notification for the volunteer.
    - **reject**: Sets status to ``rejected``, creates notification.

    Returns dict with updated observation and optional FHIR resource.
    """
    # Load observation with relationships
    result = await session.execute(
        select(Observation)
        .options(
            selectinload(Observation.ai_results),
            selectinload(Observation.review),
            selectinload(Observation.fhir_resource),
        )
        .where(Observation.id == observation_id)
    )
    observation = result.scalar_one_or_none()

    if not observation:
        raise NotFoundError("Observation not found")

    if observation.status != ObservationStatus.PENDING_REVIEW:
        raise ConflictError(
            f"Observation has already been reviewed (status: {observation.status.value})"
        )

    if observation.review is not None:
        raise ConflictError("Observation has already been reviewed")

    # Create review record
    review = ExpertReview(
        observation_id=observation_id,
        reviewer_id=reviewer.id,
        action=ReviewAction(action_data.action),
        corrections=action_data.corrections,
        rejection_reason=action_data.rejection_reason,
        review_notes=action_data.review_notes,
        review_time_seconds=action_data.review_time_seconds,
    )
    session.add(review)

    fhir_resource = None

    if action_data.action in ("confirm", "correct"):
        # Apply corrections if provided
        if action_data.corrections:
            if "species" in action_data.corrections:
                observation.top_species = action_data.corrections["species"]
            if "confidence" in action_data.corrections:
                observation.top_confidence = action_data.corrections["confidence"]

        observation.status = ObservationStatus.EXPERT_VALIDATED
        observation.updated_at = datetime.now(timezone.utc)

        # Run FHIR translator (Agent 5) and Impact (Agent 6) in background
        try:
            # Build pipeline results dict from existing AI results
            pipeline_results = _build_pipeline_results(observation)

            # Run FHIR agent
            fhir_result = await run_fhir_agent(pipeline_results)
            if fhir_result.get("resource_json"):
                fhir_row = FHIRResource(
                    observation_id=observation_id,
                    resource_type="Observation",
                    profile_url="http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah",
                    resource_json=fhir_result["resource_json"],
                    validation_status=fhir_result.get("validation_status", "unknown"),
                    sandbox_status=fhir_result.get("sandbox_status", "pending"),
                    sandbox_id=fhir_result.get("sandbox_id"),
                )
                session.add(fhir_row)
                fhir_resource = fhir_row

                # Post to FHIR sandbox
                from app.services.fhir_service import post_to_fhir_sandbox

                sandbox_result = await post_to_fhir_sandbox(
                    fhir_result["resource_json"]
                )
                fhir_row.sandbox_status = sandbox_result.get("status", "error")
                fhir_row.sandbox_id = sandbox_result.get("sandbox_id")
                if sandbox_result.get("status") == "posted":
                    fhir_row.posted_at = datetime.now(timezone.utc)

        except Exception as exc:
            logger.warning("FHIR generation failed during review: %s", exc)

        # Run Impact agent for the receipt
        try:
            impact_input = {
                "species": observation.top_species,
                "confidence": observation.top_confidence or 0,
                "quality_score": observation.confidence_score or 0,
                "routing": "expert_review",
                "water_quality": "unknown",
                "is_disease_vector": False,
                "location_name": observation.pilot_city or "your area",
                "description_params": {},
            }
            impact_result = await run_impact_agent(impact_input)
            observation.impact_text = impact_result.get("impact_text")
            observation.impact_headline = impact_result.get("headline")
        except Exception as exc:
            logger.warning("Impact generation failed during review: %s", exc)

        # Volunteer notification
        notification = Notification(
            user_id=observation.user_id,
            type="review_complete",
            title="Your observation was validated!",
            message=(
                f"A researcher confirmed your {observation.top_species or 'species'} "
                f"observation. Your data is now part of the scientific record."
            ),
            observation_id=observation_id,
        )
        session.add(notification)

    elif action_data.action == "reject":
        observation.status = ObservationStatus.REJECTED
        observation.updated_at = datetime.now(timezone.utc)

        notification = Notification(
            user_id=observation.user_id,
            type="review_complete",
            title="Observation needs resubmission 📋",
            message=(
                action_data.rejection_reason
                or "Your observation did not meet validation criteria. Please try resubmitting."
            ),
            observation_id=observation_id,
        )
        session.add(notification)

    await session.commit()
    await session.refresh(observation)

    return {
        "observation": observation,
        "fhir_resource": fhir_resource,
    }


def _build_pipeline_results(observation: Observation) -> dict[str, Any]:
    """Reconstruct a pipeline results dict from stored AI results.

    This is used when running FHIR agent during expert review — we need
    to pass the same structure that the orchestrator would produce.
    """
    results: dict[str, Any] = {
        "vision": {
            "top_species": observation.top_species,
            "top_confidence": observation.top_confidence or 0,
            "bmwp_score": 0,
            "water_quality_indication": "unknown",
            "is_disease_vector": False,
            "predictions": [],
            "status": "success",
        },
        "description": {"params": {}, "status": "success"},
        "metadata": {"validation": {}, "pilot_city": observation.pilot_city, "status": "success"},
        "quality": {
            "score": observation.confidence_score or 0,
            "routing": observation.routing or "expert_review",
        },
    }

    # Enrich from stored AI results
    for ai_result in observation.ai_results:
        if ai_result.agent_name in results and ai_result.result:
            results[ai_result.agent_name] = ai_result.result

    return results
