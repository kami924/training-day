from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.exercise import MuscleGroup
from app.models.workout_session import WorkoutStatus


class UserCreate(BaseModel):
    display_name: str = Field(default="You", max_length=80)


class UserRead(UserCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class WorkoutSessionCreate(BaseModel):
    user_id: int
    date: date
    status: WorkoutStatus = WorkoutStatus.PLANNED


class WorkoutSessionRead(WorkoutSessionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ExerciseCreate(BaseModel):
    name: str = Field(max_length=80)
    muscle_group: MuscleGroup


class ExerciseRead(ExerciseCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ExerciseLogCreate(BaseModel):
    session_id: int
    exercise_id: int
    target_sets: int = Field(default=4, ge=1, le=20)
    target_weight: float = Field(default=0, ge=0, le=999)
    completed_sets: int = Field(default=0, ge=0)


class ExerciseLogRead(ExerciseLogCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
