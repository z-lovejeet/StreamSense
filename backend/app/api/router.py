"""Main API router — aggregates all endpoint routers under /api/v1.

Each router is mounted with its own prefix and Swagger tag for clean
organization in the OpenAPI docs.
"""

from fastapi import APIRouter

from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.fhir import router as fhir_router
from app.api.observations import router as observations_router
from app.api.review import router as review_router
from app.api.validated import router as validated_router
from app.api.volunteer_stats import router as volunteer_stats_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
# Mount volunteer stats BEFORE observations to prevent /{observation_id} catching "stats"
api_router.include_router(volunteer_stats_router, prefix="/observations", tags=["Volunteer Stats"])
api_router.include_router(observations_router, prefix="/observations", tags=["Observations"])
api_router.include_router(review_router, prefix="/review", tags=["Review"])
api_router.include_router(validated_router, prefix="/validated", tags=["Validated Data"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(fhir_router, prefix="/fhir", tags=["FHIR"])
