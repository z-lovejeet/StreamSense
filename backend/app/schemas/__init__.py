"""StreamSense Pydantic schemas.

Re-exports all request and response schemas for user, observation, AI result,
expert review, FHIR resource, notification, and analytics domains.
"""

from app.schemas.ai_result import AIResultResponse
from app.schemas.analytics import SpeciesDistribution, SummaryStats
from app.schemas.fhir import FHIRResourceResponse
from app.schemas.notification import NotificationResponse
from app.schemas.observation import (
    AgentStatus,
    ObservationCreate,
    ObservationDetailResponse,
    ObservationListResponse,
    ObservationResponse,
    ObservationStatusResponse,
)
from app.schemas.review import ReviewCreate, ReviewResponse
from app.schemas.user import UserResponse, UserSyncResponse

# Resolve deferred forward references in models
ObservationDetailResponse.model_rebuild()

__all__ = [
    "AIResultResponse",
    "AgentStatus",
    "FHIRResourceResponse",
    "NotificationResponse",
    "ObservationCreate",
    "ObservationDetailResponse",
    "ObservationListResponse",
    "ObservationResponse",
    "ObservationStatusResponse",
    "ReviewCreate",
    "ReviewResponse",
    "SpeciesDistribution",
    "SummaryStats",
    "UserResponse",
    "UserSyncResponse",
]
