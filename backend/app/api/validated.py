"""Validated data endpoints — list and GeoJSON map export.

REF: DOC-04 Lines 369-375
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import require_role
from app.models.enums import ObservationStatus
from app.models.observation import Observation
from app.models.user import User
from app.schemas.observation import ObservationListResponse, ObservationResponse

router = APIRouter()

# Statuses considered "validated"
_VALIDATED = (ObservationStatus.AUTO_VALIDATED, ObservationStatus.EXPERT_VALIDATED)


def _apply_validated_filters(query, *, species, city, date_from, date_to, source):
    """Apply common filters to validated observation queries."""
    query = query.where(Observation.status.in_(_VALIDATED))

    if species:
        query = query.where(Observation.top_species == species)
    if city:
        query = query.where(Observation.pilot_city == city)
    if date_from:
        query = query.where(func.date(Observation.observed_at) >= date_from)
    if date_to:
        query = query.where(func.date(Observation.observed_at) <= date_to)
    if source == "auto_validated":
        query = query.where(Observation.status == ObservationStatus.AUTO_VALIDATED)
    elif source == "expert_validated":
        query = query.where(Observation.status == ObservationStatus.EXPERT_VALIDATED)

    return query


@router.get("", response_model=ObservationListResponse)
async def list_validated(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    species: str | None = Query(None),
    city: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    source: str | None = Query(None, description="auto_validated or expert_validated"),
    user: User = Depends(require_role("researcher", "volunteer")),
    session: AsyncSession = Depends(get_session),
):
    """List validated observations with filtering.

    Returns observations with status ``auto_validated`` or ``expert_validated``.
    Supports filtering by species, city, date range, and validation source.
    """
    query = select(Observation)
    count_query = select(func.count(Observation.id))

    query = _apply_validated_filters(
        query, species=species, city=city, date_from=date_from, date_to=date_to, source=source
    )
    count_query = _apply_validated_filters(
        count_query, species=species, city=city, date_from=date_from, date_to=date_to, source=source
    )

    total = (await session.execute(count_query)).scalar() or 0

    offset = (page - 1) * limit
    query = query.order_by(Observation.observed_at.desc()).offset(offset).limit(limit)
    observations = list((await session.execute(query)).scalars().all())

    return ObservationListResponse(
        observations=[ObservationResponse.model_validate(o) for o in observations],
        total=total,
        page=page,
    )


@router.get("/map")
async def get_validated_map(
    species: str | None = Query(None),
    city: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    user: User = Depends(require_role("researcher", "volunteer")),
    session: AsyncSession = Depends(get_session),
):
    """Get validated observations as GeoJSON FeatureCollection for map rendering.

    Returns a GeoJSON-compliant response suitable for Leaflet/Mapbox layers.
    Coordinates are in ``[longitude, latitude]`` order per GeoJSON spec.
    """
    query = select(Observation)
    query = _apply_validated_filters(
        query, species=species, city=city, date_from=date_from, date_to=date_to, source=None
    )
    query = query.order_by(Observation.observed_at.desc()).limit(1000)

    observations = list((await session.execute(query)).scalars().all())

    features = []
    for obs in observations:
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [obs.longitude, obs.latitude],
                },
                "properties": {
                    "id": str(obs.id),
                    "species": obs.top_species,
                    "confidence": obs.confidence_score,
                    "validation_type": obs.status.value if hasattr(obs.status, 'value') else str(obs.status),
                    "observed_at": obs.observed_at.isoformat() if obs.observed_at else None,
                    "thumbnail_url": obs.image_thumbnail_url or obs.image_url,
                    "location_name": obs.location_name,
                    "pilot_city": obs.pilot_city,
                },
            }
        )

    return {"type": "FeatureCollection", "features": features}
