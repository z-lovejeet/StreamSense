"""StreamSense enums — Python enums mapping to PostgreSQL ENUM types.

These enums are used by SQLAlchemy ORM models and Pydantic schemas.
PostgreSQL will create corresponding ENUM types during migration:
  - user_role: volunteer | researcher
  - observation_status: processing | auto_validated | pending_review | expert_validated | rejected
  - review_action: confirm | correct | reject
"""

import enum


class UserRole(str, enum.Enum):
    """User roles: volunteer (default) or researcher."""

    VOLUNTEER = "volunteer"
    RESEARCHER = "researcher"


class ObservationStatus(str, enum.Enum):
    """Observation lifecycle status in the AI pipeline.

    Flow: processing → auto_validated (score >= 70)
                      → pending_review (score < 70) → expert_validated / rejected
    """

    PROCESSING = "processing"
    AUTO_VALIDATED = "auto_validated"
    PENDING_REVIEW = "pending_review"
    EXPERT_VALIDATED = "expert_validated"
    REJECTED = "rejected"


class ReviewAction(str, enum.Enum):
    """Expert review actions for observations routed to pending_review."""

    CONFIRM = "confirm"
    CORRECT = "correct"
    REJECT = "reject"
