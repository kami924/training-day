export type MuscleGroup = "胸" | "肩" | "背" | "臀腿" | "手臂" | "腹部" | "自定义";

export type MuscleGroupId =
  | "chest"
  | "shoulder"
  | "back"
  | "glutesLegs"
  | "arms"
  | "abs"
  | "custom";

export type Exercise = {
  customGroupLabel?: string;
  id: string;
  name: {
    zh: string;
    en: string;
  };
  muscleGroup: MuscleGroup;
};

export type WorkoutStatus = "planned" | "active" | "done" | "skipped";

export type ArchiveEntry = {
  date: string;
  muscleLabels?: string[];
  status: WorkoutStatus;
  muscles: MuscleGroup[];
};

export type ArchiveMap = Record<string, ArchiveEntry>;

export type CompletedExerciseLog = {
  completedAt: string;
  completedSets: number;
  customGroupLabel?: string;
  exerciseId: string;
  id: string;
  muscleGroup: MuscleGroup;
  name: {
    zh: string;
    en: string;
  };
  targetSets: number;
  targetWeight: number;
};

export type LocalWorkoutSession = {
  date: string;
  logs: CompletedExerciseLog[];
  status: "done";
};

export type ImportedWorkoutRow = {
  completedSets: number;
  date: string;
  exerciseName: string;
  id: string;
  muscleGroup: MuscleGroup;
  rawStatus: string;
  targetWeight: number;
};

export type WorkoutImportDraft = {
  fileName?: string;
  rows: ImportedWorkoutRow[];
  source: "file" | "text";
};

export type ActiveWorkoutPlan = {
  completedIds: string[];
  customGroupLabel?: string;
  muscleId: MuscleGroupId;
  selectedIds: string[];
};
