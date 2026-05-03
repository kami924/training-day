from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.exercise import Exercise, MuscleGroup

DEFAULT_EXERCISES = [
    ("俯卧撑", MuscleGroup.CHEST),
    ("哑铃肩推", MuscleGroup.SHOULDER),
    ("引体向上", MuscleGroup.BACK),
    ("深蹲", MuscleGroup.GLUTES_LEGS),
    ("弯举", MuscleGroup.ARMS),
    ("卷腹", MuscleGroup.ABS),
]


def seed_exercises(session: Session) -> None:
    existing = {name for (name,) in session.query(Exercise.name).all()}
    for name, muscle_group in DEFAULT_EXERCISES:
        if name not in existing:
            session.add(Exercise(name=name, muscle_group=muscle_group))
    session.commit()
