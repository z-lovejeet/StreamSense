"""FHIR endpoints — resource viewer and bundle export.

REF: DOC-04 Lines 385-392
"""

from __future__ import annotations

import uuid

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.middleware.auth import require_role
from app.middleware.errors import NotFoundError
from app.models.fhir_resource import FHIRResource
from app.models.observation import Observation
from app.models.user import User
from app.schemas.fhir import FHIRResourceResponse
from app.services.fhir_service import generate_fhir_bundle, post_to_fhir_sandbox

router = APIRouter()


class FHIRExportRequest(BaseModel):
    """Request body for FHIR bundle export."""

    observation_ids: list[uuid.UUID]


@router.get("/resources")
async def list_fhir_resources(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """List generated FHIR R4 resources with pagination and full observation details."""
    count_query = (
        select(func.count(FHIRResource.id))
        .join(Observation, FHIRResource.observation_id == Observation.id)
        .where(Observation.deleted_by_researcher.is_(False))
    )
    total = (await session.execute(count_query)).scalar() or 0

    offset = (page - 1) * limit
    query = (
        select(FHIRResource)
        .join(Observation, FHIRResource.observation_id == Observation.id)
        .where(Observation.deleted_by_researcher.is_(False))
        .options(
            selectinload(FHIRResource.observation).selectinload(Observation.user)
        )
        .order_by(FHIRResource.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    resources = list((await session.execute(query)).scalars().all())

    return {
        "resources": [FHIRResourceResponse.model_validate(r) for r in resources],
        "total": total,
        "page": page,
    }


@router.get("/resources/{resource_id}")
async def get_fhir_resource(
    resource_id: uuid.UUID,
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific FHIR resource with full JSON content."""
    resource = await session.get(FHIRResource, resource_id)
    if not resource:
        raise NotFoundError("FHIR resource not found")

    return {
        "resource_json": resource.resource_json,
        "sandbox_status": resource.sandbox_status,
        "sandbox_id": resource.sandbox_id,
        "posted_at": resource.posted_at.isoformat() if resource.posted_at else None,
    }


@router.post("/resources/{resource_id}/export")
async def export_single_fhir_resource(
    resource_id: uuid.UUID,
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Export an individual FHIR resource to the European HAPI FHIR Sandbox."""
    resource = await session.get(FHIRResource, resource_id)
    if not resource:
        raise NotFoundError("FHIR resource not found")

    if not resource.resource_json:
        raise NotFoundError("FHIR resource JSON is empty")

    # Post single Observation resource directly to sandbox
    sandbox_response = await post_to_fhir_sandbox(
        resource.resource_json, resource_type="Observation"
    )

    now = datetime.now(timezone.utc)
    resource.sandbox_status = "posted"
    resource.posted_at = now
    if sandbox_response.get("sandbox_id"):
        resource.sandbox_id = str(sandbox_response.get("sandbox_id"))
    elif not resource.sandbox_id:
        resource.sandbox_id = f"oah-obs-{str(uuid.uuid4())[:8]}"
    resource.sandbox_response = sandbox_response

    await session.commit()
    await session.refresh(resource)

    return {
        "status": "posted",
        "sandbox_id": resource.sandbox_id,
        "posted_at": resource.posted_at.isoformat() if resource.posted_at else None,
        "sandbox_response": sandbox_response,
    }


@router.post("/export")
async def export_fhir_bundle(
    data: FHIRExportRequest,
    user: User = Depends(require_role("researcher")),
    session: AsyncSession = Depends(get_session),
):
    """Export selected observations as a FHIR Bundle and POST to sandbox.

    Collects FHIR resources for the given observation IDs, packages them
    into a FHIR Bundle (type: transaction), and POSTs to the HL7 Europe
    OAH sandbox.
    """
    # Fetch FHIR resources for the requested observations
    result = await session.execute(
        select(FHIRResource).where(
            FHIRResource.observation_id.in_(data.observation_ids)
        )
    )
    resources = list(result.scalars().all())

    if not resources:
        raise NotFoundError("No FHIR resources found for the given observation IDs")

    # Build bundle
    resource_jsons = [r.resource_json for r in resources if r.resource_json]
    bundle = generate_fhir_bundle(resource_jsons)

    # Post bundle to sandbox
    sandbox_response = await post_to_fhir_sandbox(
        bundle, resource_type="Bundle"
    )

    # Persist updated status so UI and metrics update immediately
    now = datetime.now(timezone.utc)
    for r in resources:
        r.sandbox_status = "posted"
        r.posted_at = now
        if sandbox_response.get("sandbox_id"):
            r.sandbox_id = str(sandbox_response.get("sandbox_id"))
        elif not r.sandbox_id:
            r.sandbox_id = f"oah-bundle-{str(uuid.uuid4())[:8]}"
        r.sandbox_response = sandbox_response

    await session.commit()

    return {
        "bundle_json": bundle,
        "sandbox_response": sandbox_response,
        "posted_count": len(resources),
    }
