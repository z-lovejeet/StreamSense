"""User model — stores volunteer and researcher profiles.

Maps to Supabase Auth user IDs. The `id` column matches the Supabase Auth UUID
so we can correlate JWT claims with our application data.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Enum, Index, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import UserRole


class User(Base):
    """Application user — either a volunteer or a researcher."""

    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_role", "role"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.VOLUNTEER,
    )
    avatar_url = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    observations = relationship("Observation", back_populates="user")
    reviews = relationship("ExpertReview", back_populates="reviewer")
    notifications = relationship("Notification", back_populates="user")
