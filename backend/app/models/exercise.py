from __future__ import annotations

from enum import Enum as PyEnum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MuscleGroup(str, PyEnum):
    CHEST = "胸"
    SHOULDER = "肩"
    BACK = "背"
    GLUTES_LEGS = "臀腿"
    ARMS = "手臂"
    ABS = "腹部"


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    muscle_group: Mapped[MuscleGroup] = mapped_column(
        Enum(
            MuscleGroup,
            values_callable=lambda values: [item.value for item in values],
        ),
        index=True,
    )

    logs = relationship("ExerciseLog", back_populates="exercise")
