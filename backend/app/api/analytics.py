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
    # Total observations (excluding deleted)
    total = (
        await session.execute(
            select(func.count(Observation.id)).where(
                Observation.deleted_by_researcher == False
            )
        )
    ).scalar() or 0

    # Counts by status
    status_counts = {}
    result = await session.execute(
        select(Observation.status, func.count(Observation.id))
        .where(Observation.deleted_by_researcher == False)
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
        ).where(Observation.deleted_by_researcher == False)
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
        .where(Observation.deleted_by_researcher == False)
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
        .where(
            Observation.top_species.is_not(None),
            Observation.deleted_by_researcher == False,
        )
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
        .where(
            Observation.confidence_score.is_not(None),
            Observation.deleted_by_researcher == False,
        )
        .group_by("range")
    )

    # Ensure all buckets exist
    buckets = {"90-100": 0, "80-89": 0, "70-79": 0, "50-69": 0, "<50": 0}
    for row in result.all():
        buckets[row.range] = row.count

    data = [{"range": k, "count": v} for k, v in buckets.items()]

    return {"data": data}


@router.get("/pilot-basins")
async def get_pilot_basins_status(
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Real-time ecological status and DipteraCAST vector risk per pilot city watershed.

    Dynamically computes BMWP quality scores, dominant taxa, validation states,
    and vector risk levels based on live observations in the database.
    """
    from collections import Counter
    from app.agents.prompts.vision_config import (
        DISEASE_VECTOR_TAXA,
        TAXA_COMMON_NAMES,
    )

    city_meta = {
        "Coimbra": {"country": "Portugal", "basin": "Rio Mondego"},
        "Toulouse": {"country": "France", "basin": "Canal du Midi"},
        "Benevento": {"country": "Italy", "basin": "Fiume Calore"},
        "Ghent": {"country": "Belgium", "basin": "River Scheldt"},
        "Oslo": {"country": "Norway", "basin": "Akerselva River"},
    }

    result = await session.execute(
        select(Observation).where(Observation.deleted_by_researcher == False)
    )
    obs_list = result.scalars().all()

    city_obs: dict[str, list[Observation]] = {c: [] for c in city_meta}
    for o in obs_list:
        city = o.pilot_city
        if city in city_obs:
            city_obs[city].append(o)
        elif o.location_name:
            for c in city_meta:
                if c.lower() in o.location_name.lower():
                    city_obs[c].append(o)
                    break

    basins = []
    forecast = []

    for city, meta in city_meta.items():
        observations = city_obs[city]
        total = len(observations)
        pending = [o for o in observations if o.status == ObservationStatus.PENDING_REVIEW]
        scores = [o.confidence_score for o in observations if o.confidence_score is not None]
        avg_score = round(sum(scores) / len(scores)) if scores else 70

        taxa = [o.top_species for o in observations if o.top_species]
        if taxa:
            most_common_taxon = Counter(taxa).most_common(1)[0][0]
            common_name = TAXA_COMMON_NAMES.get(most_common_taxon, most_common_taxon)
            dominant_str = f"{most_common_taxon} ({common_name})"
        else:
            dominant_str = "Diverse Macroinvertebrates"

        # Check disease vectors
        has_vector = any(
            (o.top_species in DISEASE_VECTOR_TAXA or (o.status == ObservationStatus.PENDING_REVIEW and o.top_species in {"Culicidae", "Simuliidae", "Chironomidae"}))
            for o in observations
        )
        has_chironomidae = any(o.top_species == "Chironomidae" for o in observations)

        if pending and has_vector:
            vector_risk = "High Alert"
            risk_level = "High"
        elif has_vector:
            vector_risk = "High Alert"
            risk_level = "High"
        elif has_chironomidae:
            vector_risk = "Moderate"
            risk_level = "Moderate"
        else:
            vector_risk = "Low" if avg_score < 90 else "Very Low"
            risk_level = "Low"

        if pending:
            status = "Under Review"
            status_style = "bg-danger-50 text-danger-700 border-danger-200"
            dot_style = "bg-danger-500"
            urgent = True
            first_pending_id = str(pending[0].id)
        else:
            urgent = False
            first_pending_id = None
            if avg_score >= 85:
                status = "High Quality"
                status_style = "bg-success-50 text-success-700 border-success-200"
                dot_style = "bg-success-500"
            elif avg_score >= 60:
                status = "Good"
                status_style = "bg-success-50 text-success-700 border-success-200"
                dot_style = "bg-success-500"
            else:
                status = "Moderate"
                status_style = "bg-amber-50 text-amber-700 border-amber-200"
                dot_style = "bg-amber-500"

        basins.append({
            "city": city,
            "country": meta["country"],
            "basin": meta["basin"],
            "status": status,
            "bmwpScore": avg_score,
            "dominantTaxon": dominant_str,
            "vectorRisk": vector_risk,
            "statusStyle": status_style,
            "dotStyle": dot_style,
            "urgent": urgent,
            "pendingId": first_pending_id,
            "observationCount": total,
        })

        risk_colors = {
            "Low": "bg-success-50 text-success-700 border-success-200",
            "Moderate": "bg-amber-50 text-amber-700 border-amber-200",
            "High": "bg-danger-50 text-danger-700 border-danger-200",
        }
        forecast.append({
            "city": city,
            "risk": risk_level,
            "color": risk_colors.get(risk_level, risk_colors["Low"]),
        })

    return {
        "basins": basins,
        "forecast": forecast,
    }

