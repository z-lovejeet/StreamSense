"""Analytics endpoints — aggregate statistics and chart data.

REF: DOC-04 Lines 376-384
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import case, cast, Float, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import require_role
from app.models.enums import ObservationStatus
from app.models.observation import Observation
from app.models.user import User

router = APIRouter()


@router.get("/summary")
async def get_summary(
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """High-level summary statistics across all observations.

    Returns total counts by status, average confidence, and average pipeline time.
    """
    # Total observations
    total = (await session.execute(select(func.count(Observation.id)))).scalar() or 0

    # Counts by status
    status_counts = {}
    result = await session.execute(
        select(Observation.status, func.count(Observation.id))
        .group_by(Observation.status)
    )
    for row in result.all():
        status_val = row[0].value if hasattr(row[0], "value") else str(row[0])
        status_counts[status_val] = row[1]

    # Averages
    avg_result = await session.execute(
        select(
            func.avg(Observation.confidence_score),
            func.avg(Observation.pipeline_time_seconds),
        )
    )
    avgs = avg_result.one()

    return {
        "total_observations": total,
        "auto_validated_count": status_counts.get("auto_validated", 0),
        "expert_validated_count": status_counts.get("expert_validated", 0),
        "rejected_count": status_counts.get("rejected", 0),
        "pending_review": status_counts.get("pending_review", 0),
        "avg_confidence": round(avgs[0], 1) if avgs[0] else None,
        "avg_pipeline_time": round(avgs[1], 1) if avgs[1] else None,
    }


@router.get("/timeline")
async def get_timeline(
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Submissions over time for trend charting.

    Groups by date and counts total submissions and validated observations.
    """
    result = await session.execute(
        select(
            func.date(Observation.observed_at).label("date"),
            func.count(Observation.id).label("submissions"),
            func.count(
                case(
                    (
                        Observation.status.in_(
                            [ObservationStatus.AUTO_VALIDATED, ObservationStatus.EXPERT_VALIDATED]
                        ),
                        Observation.id,
                    )
                )
            ).label("validated"),
        )
        .group_by(func.date(Observation.observed_at))
        .order_by(func.date(Observation.observed_at))
    )

    data = [
        {
            "date": str(row.date),
            "submissions": row.submissions,
            "validated": row.validated,
        }
        for row in result.all()
    ]

    return {"data": data}


@router.get("/species")
async def get_species_distribution(
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Species distribution across all observations.

    Groups by top_species and returns counts and average confidence.
    """
    result = await session.execute(
        select(
            Observation.top_species,
            func.count(Observation.id).label("count"),
            func.avg(Observation.top_confidence).label("avg_confidence"),
        )
        .where(Observation.top_species.is_not(None))
        .group_by(Observation.top_species)
        .order_by(func.count(Observation.id).desc())
    )

    # Map species to common names
    from app.agents.prompts.vision_config import TAXA_COMMON_NAMES

    data = []
    for row in result.all():
        data.append(
            {
                "species": row.top_species,
                "common_name": TAXA_COMMON_NAMES.get(row.top_species),
                "count": row.count,
                "avg_confidence": round(row.avg_confidence * 100, 1) if row.avg_confidence else None,
            }
        )

    return {"data": data}


@router.get("/confidence")
async def get_confidence_distribution(
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Confidence score distribution as histogram buckets.

    Buckets: 90-100, 80-89, 70-79, 50-69, <50
    """
    result = await session.execute(
        select(
            case(
                (Observation.confidence_score >= 90, "90-100"),
                (Observation.confidence_score >= 80, "80-89"),
                (Observation.confidence_score >= 70, "70-79"),
                (Observation.confidence_score >= 50, "50-69"),
                else_="<50",
            ).label("range"),
            func.count(Observation.id).label("count"),
        )
        .where(Observation.confidence_score.is_not(None))
        .group_by("range")
    )

    # Ensure all buckets exist
    buckets = {"90-100": 0, "80-89": 0, "70-79": 0, "50-69": 0, "<50": 0}
    for row in result.all():
        buckets[row.range] = row.count

    data = [{"range": k, "count": v} for k, v in buckets.items()]

    return {"data": data}
