"""FHIR endpoints — resource viewer and bundle export.

REF: DOC-04 Lines 385-392
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import require_role
from app.middleware.errors import NotFoundError
from app.models.fhir_resource import FHIRResource
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
    """List generated FHIR R4 resources with pagination."""
    count_query = select(func.count(FHIRResource.id))
    total = (await session.execute(count_query)).scalar() or 0

    offset = (page - 1) * limit
    query = (
        select(FHIRResource)
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

    return {
        "bundle_json": bundle,
        "sandbox_response": sandbox_response,
    }
