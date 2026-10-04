"""Volunteer stats endpoint — real-time gamification data from observations.

Provides dynamic stats for XP, badges, missions, and eco-impact
computed from actual database records rather than hardcoded values.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, distinct, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import get_current_user
from app.models.enums import ObservationStatus
from app.models.observation import Observation
from app.models.fhir_resource import FHIRResource
from app.models.user import User

router = APIRouter()

# EPT (Ephemeroptera, Plecoptera, Trichoptera) sensitive taxa
EPT_TAXA = {
    "Ephemeroptera", "Plecoptera", "Trichoptera",
    "Baetidae", "Heptageniidae", "Leuctridae",
    "Hydropsychidae",
}

BMWP_SCORES = {
    "Ephemeroptera": 10, "Plecoptera": 10, "Trichoptera": 8,
    "Heptageniidae": 10, "Leuctridae": 10, "Baetidae": 4,
    "Hydropsychidae": 5, "Gammaridae": 6, "Asellidae": 3,
    "Chironomidae": 2, "Oligochaeta": 1, "Tubificidae": 1,
    "Culicidae": 0, "Simuliidae": 5, "Gastropoda": 3,
}


@router.get("/stats")
async def get_volunteer_stats(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Compute real-time gamification stats for the current volunteer.

    Returns observation counts, species data, unique cities,
    confidence scores, seasons, and FHIR resource counts
    for dynamic badge/XP/mission computation on the frontend.
    """
    user_filter = and_(
        Observation.user_id == user.id,
        Observation.deleted_by_volunteer == False,
    )

    # Total observations
    total_result = await session.execute(
        select(func.count(Observation.id)).where(user_filter)
    )
    total_observations = total_result.scalar() or 0

    # Validated observations
    validated_result = await session.execute(
        select(func.count(Observation.id)).where(
            user_filter,
            Observation.status.in_([
                ObservationStatus.AUTO_VALIDATED,
                ObservationStatus.EXPERT_VALIDATED,
            ]),
        )
    )
    validated_count = validated_result.scalar() or 0

    # Auto-validated count
    auto_result = await session.execute(
        select(func.count(Observation.id)).where(
            user_filter,
            Observation.status == ObservationStatus.AUTO_VALIDATED,
        )
    )
    auto_validated_count = auto_result.scalar() or 0

    # Pending count
    pending_result = await session.execute(
        select(func.count(Observation.id)).where(
            user_filter,
            Observation.status == ObservationStatus.PENDING_REVIEW,
        )
    )
    pending_count = pending_result.scalar() or 0

    # All species identified by this user
    species_result = await session.execute(
        select(Observation.top_species).where(
            user_filter,
            Observation.top_species.is_not(None),
        )
    )
    all_species = [row[0] for row in species_result.all()]
    unique_species = list(set(all_species))

    # Check EPT taxa found
    ept_found = [s for s in unique_species if s in EPT_TAXA]

    # Unique pilot cities
    cities_result = await session.execute(
        select(distinct(Observation.pilot_city)).where(
            user_filter,
            Observation.pilot_city.is_not(None),
        )
    )
    unique_cities = [row[0] for row in cities_result.all()]

    # Average confidence score across all validated observations
    avg_conf_result = await session.execute(
        select(func.avg(Observation.confidence_score)).where(
            user_filter,
            Observation.confidence_score.is_not(None),
        )
    )
    avg_confidence = avg_conf_result.scalar()

    # Observations with 85%+ confidence
    high_conf_result = await session.execute(
        select(func.count(Observation.id)).where(
            user_filter,
            Observation.confidence_score >= 85,
            Observation.status.in_([
                ObservationStatus.AUTO_VALIDATED,
                ObservationStatus.EXPERT_VALIDATED,
            ]),
        )
    )
    high_confidence_validated = high_conf_result.scalar() or 0

    # Unique seasons observed (from observed_at month)
    seasons_result = await session.execute(
        select(
            func.extract("month", Observation.observed_at).label("month"),
        ).where(user_filter).group_by("month")
    )
    months_observed = [int(row[0]) for row in seasons_result.all()]
    # Map months to seasons: DJF=winter, MAM=spring, JJA=summer, SON=autumn
    seasons_seen = set()
    for m in months_observed:
        if m in (12, 1, 2):
            seasons_seen.add("winter")
        elif m in (3, 4, 5):
            seasons_seen.add("spring")
        elif m in (6, 7, 8):
            seasons_seen.add("summer")
        else:
            seasons_seen.add("autumn")

    # FHIR resources generated for this user's observations
    fhir_result = await session.execute(
        select(func.count(FHIRResource.id)).where(
            FHIRResource.observation_id.in_(
                select(Observation.id).where(user_filter)
            )
        )
    )
    fhir_count = fhir_result.scalar() or 0

    # Has description (for "One Health Sentinel" badge — user provided descriptive data)
    desc_result = await session.execute(
        select(func.count(Observation.id)).where(
            user_filter,
            Observation.description.is_not(None),
            func.length(Observation.description) > 20,
        )
    )
    descriptive_observations = desc_result.scalar() or 0

    # Mean BMWP score for identified species
    bmwp_scores = [BMWP_SCORES.get(s, 0) for s in all_species if s in BMWP_SCORES]
    mean_bmwp = round(sum(bmwp_scores) / len(bmwp_scores), 1) if bmwp_scores else 0

    return {
        "total_observations": total_observations,
        "validated_count": validated_count,
        "auto_validated_count": auto_validated_count,
        "pending_count": pending_count,
        "unique_species": unique_species,
        "ept_taxa_found": ept_found,
        "unique_cities": unique_cities,
        "avg_confidence": round(float(avg_confidence), 1) if avg_confidence else None,
        "high_confidence_validated": high_confidence_validated,
        "seasons_observed": list(seasons_seen),
        "fhir_count": fhir_count,
        "descriptive_observations": descriptive_observations,
        "mean_bmwp": mean_bmwp,
    }
