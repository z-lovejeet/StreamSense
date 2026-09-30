"""Notification model — in-app notifications for users.

Notifications are created when observations are reviewed, validated, or rejected.
The `read` flag tracks whether the user has dismissed the notification.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    """In-app notification targeting a specific user."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("idx_notifications_user", "user_id"),
        Index(
            "idx_notifications_unread",
            "user_id",
            "read",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    observation_id = Column(
        UUID(as_uuid=True), ForeignKey("observations.id"), nullable=True
    )
    read = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="notifications")
    observation = relationship("Observation", back_populates="notifications")
