from __future__ import annotations

from datetime import date, datetime
from enum import Enum as PyEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class WorkoutStatus(str, PyEnum):
    PLANNED = "planned"
    ACTIVE = "active"
    DONE = "done"
    SKIPPED = "skipped"


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_workout_sessions_user_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[WorkoutStatus] = mapped_column(
        Enum(
            WorkoutStatus,
            values_callable=lambda values: [item.value for item in values],
        ),
        default=WorkoutStatus.PLANNED,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="sessions")
    logs = relationship(
        "ExerciseLog",
        back_populates="session",
        cascade="all, delete-orphan",
    )
