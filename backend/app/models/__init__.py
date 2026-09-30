"""StreamSense ORM models — re-export all models for Alembic auto-detection.

Importing from this module ensures all model classes are registered
on Base.metadata, which Alembic needs to detect tables for autogenerate.
"""

from app.models.enums import ObservationStatus, ReviewAction, UserRole
from app.models.user import User
from app.models.observation import Observation
from app.models.ai_result import AIResult
from app.models.expert_review import ExpertReview
from app.models.fhir_resource import FHIRResource
from app.models.notification import Notification
from app.models.species_reference import SpeciesReference

__all__ = [
    "UserRole",
    "ObservationStatus",
    "ReviewAction",
    "User",
    "Observation",
    "AIResult",
    "ExpertReview",
    "FHIRResource",
    "Notification",
    "SpeciesReference",
]
