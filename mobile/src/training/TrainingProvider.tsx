import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { archiveByDate as seedArchiveByDate } from "@/data/archiveSeed";
import {
  ActiveWorkoutPlan,
  ArchiveMap,
  CompletedExerciseLog,
  Exercise,
  ImportedWorkoutRow,
  LocalWorkoutSession,
  WorkoutImportDraft,
} from "@/types/training";

type RecordExerciseInput = {
  completedSets: number;
  exercise: Exercise;
  targetSets: number;
  targetWeight: number;
};

type TrainingContextValue = {
  activePlan?: ActiveWorkoutPlan;
  archiveByDate: ArchiveMap;
  clearActivePlan: () => void;
  clearImportDraft: () => void;
  getSessionByDate: (date: string) => LocalWorkoutSession | undefined;
  favoriteExerciseIds: string[];
  importDraft?: WorkoutImportDraft;
  applyImportDraft: () => string | undefined;
  pendingSummaryDate?: string;
  queueTodaySummary: () => void;
  clearPendingSummary: () => void;
  revealArchiveDate: (date: string) => void;
  setImportDraft: (draft: WorkoutImportDraft | undefined) => void;
  setActivePlan: (plan: ActiveWorkoutPlan) => void;
  setCompletedExerciseIds: (completedIds: string[]) => void;
  recordExerciseCompletion: (input: RecordExerciseInput) => void;
  sessions: LocalWorkoutSession[];
  todaySession?: LocalWorkoutSession;
  toggleFavoriteExercise: (exerciseId: string) => void;
};

const TrainingContext = createContext<TrainingContextValue | null>(null);
let sessionMemory: Record<string, LocalWorkoutSession> = {};

function normalizeIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function sameIds(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((id, index) => id === right[index]);
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function uniqueMuscles(logs: CompletedExerciseLog[]) {
  return Array.from(new Set(logs.map((log) => log.muscleGroup)));
}

function uniqueArchiveMarks(logs: CompletedExerciseLog[]) {
  const marks = new Map<string, { label: string; muscle: Exercise["muscleGroup"] }>();

  logs.forEach((log) => {
    const label = log.customGroupLabel ?? log.muscleGroup;
    const key = `${log.muscleGroup}:${label}`;

    if (!marks.has(key)) {
      marks.set(key, {
        label,
        muscle: log.muscleGroup,
      });
    }
  });

  return Array.from(marks.values());
}

export function TrainingProvider({ children }: PropsWithChildren) {
  const [activePlan, setActivePlanState] = useState<ActiveWorkoutPlan | undefined>();
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<string[]>([]);
  const [importDraft, setImportDraftState] = useState<WorkoutImportDraft | undefined>();
  const [pendingSummaryDate, setPendingSummaryDate] = useState<string | undefined>();
  const [sessionsByDate, setSessionsByDate] = useState<
    Record<string, LocalWorkoutSession>
  >(sessionMemory);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const setActivePlan = useCallback((plan: ActiveWorkoutPlan) => {
    const nextPlan = {
      completedIds: normalizeIds(plan.completedIds),
      customGroupLabel: plan.customGroupLabel?.trim() || undefined,
      muscleId: plan.muscleId,
      selectedIds: normalizeIds(plan.selectedIds),
    };

    setActivePlanState((current) => {
      if (
        current &&
        current.customGroupLabel === nextPlan.customGroupLabel &&
        current.muscleId === nextPlan.muscleId &&
        sameIds(current.completedIds, nextPlan.completedIds) &&
        sameIds(current.selectedIds, nextPlan.selectedIds)
      ) {
        return current;
      }

      return nextPlan;
    });
  }, []);

  const setCompletedExerciseIds = useCallback((completedIds: string[]) => {
    setActivePlanState((current) => {
      if (!current) {
        return current;
      }

      const nextCompletedIds = normalizeIds(completedIds);

      if (sameIds(current.completedIds, nextCompletedIds)) {
        return current;
      }

      return {
        ...current,
        completedIds: nextCompletedIds,
      };
    });
  }, []);

  const clearActivePlan = useCallback(() => {
    setActivePlanState(undefined);
  }, []);

  const setImportDraft = useCallback((draft: WorkoutImportDraft | undefined) => {
    setImportDraftState(draft);
  }, []);

  const clearImportDraft = useCallback(() => {
    setImportDraftState(undefined);
  }, []);

  const queueTodaySummary = useCallback(() => {
    setPendingSummaryDate(toIsoDate(new Date()));
  }, []);

  const clearPendingSummary = useCallback(() => {
    setPendingSummaryDate(undefined);
  }, []);

  const revealArchiveDate = useCallback((date: string) => {
    setPendingSummaryDate(date);
  }, []);

  const toggleFavoriteExercise = useCallback((exerciseId: string) => {
    setFavoriteExerciseIds((current) => {
      if (current.includes(exerciseId)) {
        return current.filter((id) => id !== exerciseId);
      }

      return [...current, exerciseId];
    });
  }, []);

  const recordExerciseCompletion = useCallback(
    ({
      completedSets,
      exercise,
      targetSets,
      targetWeight,
    }: RecordExerciseInput) => {
      const completedAt = new Date().toISOString();
      const date = toIsoDate(new Date());

      setSessionsByDate((current) => {
        const existing = current[date] ?? {
          date,
          logs: [],
          status: "done" as const,
        };
        const log: CompletedExerciseLog = {
          completedAt,
          completedSets,
          customGroupLabel: exercise.customGroupLabel,
          exerciseId: exercise.id,
          id: `${exercise.id}-${completedAt}`,
          muscleGroup: exercise.muscleGroup,
          name: exercise.name,
          targetSets,
          targetWeight,
        };

        const next = {
          ...current,
          [date]: {
            ...existing,
            logs: [...existing.logs, log],
          },
        };
        sessionMemory = next;

        return next;
      });
    },
    [],
  );

  const applyImportDraft = useCallback(() => {
    if (!importDraft?.rows.length) {
      return undefined;
    }

    const latestDate = importDraft.rows
      .map((row) => row.date)
      .sort((left, right) => right.localeCompare(left))[0];

    setSessionsByDate((current) => {
      const next = { ...current };
      const counters = new Map<string, number>();

      importDraft.rows.forEach((row) => {
        const existing = next[row.date] ?? {
          date: row.date,
          logs: [],
          status: "done" as const,
        };
        const nextIndex = (counters.get(row.date) ?? existing.logs.length) + 1;
        counters.set(row.date, nextIndex);

        const log: CompletedExerciseLog = createImportedLog(row, nextIndex);
        next[row.date] = {
          ...existing,
          logs: [...existing.logs, log],
        };
      });

      sessionMemory = next;
      return next;
    });

    setImportDraftState(undefined);
    return latestDate;
  }, [importDraft]);

  const sessions = useMemo(
    () =>
      Object.values(sessionsByDate).sort((left, right) =>
        right.date.localeCompare(left.date),
      ),
    [sessionsByDate],
  );

  const getSessionByDate = useCallback(
    (date: string) => sessionsByDate[date],
    [sessionsByDate],
  );

  const archiveByDate = useMemo(() => {
    const archive: ArchiveMap = { ...seedArchiveByDate };

    sessions.forEach((session) => {
      const marks = uniqueArchiveMarks(session.logs);

      archive[session.date] = {
        date: session.date,
        muscleLabels: marks.map((mark) => mark.label),
        muscles: uniqueMuscles(session.logs),
        status: "done",
      };
    });

    return archive;
  }, [sessions]);

  const value = useMemo(
    () => ({
      activePlan,
      applyImportDraft,
      archiveByDate,
      clearActivePlan,
      clearImportDraft,
      clearPendingSummary,
      favoriteExerciseIds,
      getSessionByDate,
      importDraft,
      pendingSummaryDate,
      queueTodaySummary,
      revealArchiveDate,
      setImportDraft,
      setActivePlan,
      setCompletedExerciseIds,
      recordExerciseCompletion,
      sessions,
      todaySession: sessionsByDate[todayIso],
      toggleFavoriteExercise,
    }),
    [
      activePlan,
      applyImportDraft,
      archiveByDate,
      clearActivePlan,
      clearImportDraft,
      clearPendingSummary,
      favoriteExerciseIds,
      getSessionByDate,
      importDraft,
      pendingSummaryDate,
      queueTodaySummary,
      revealArchiveDate,
      setImportDraft,
      recordExerciseCompletion,
      sessions,
      sessionsByDate,
      setActivePlan,
      setCompletedExerciseIds,
      todayIso,
      toggleFavoriteExercise,
    ],
  );

  return (
    <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>
  );
}

function createImportedLog(row: ImportedWorkoutRow, index: number): CompletedExerciseLog {
  const completedAt = `${row.date}T${String(Math.min(index + 8, 23)).padStart(2, "0")}:00:00.000Z`;

  return {
    completedAt,
    completedSets: row.completedSets,
    exerciseId: `imported-${normalizeImportedKey(row.exerciseName)}`,
    id: `${row.id}-${index}`,
    muscleGroup: row.muscleGroup,
    name: {
      zh: row.exerciseName,
      en: row.exerciseName,
    },
    targetSets: row.completedSets,
    targetWeight: row.targetWeight,
  };
}

function normalizeImportedKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function useTraining() {
  const value = useContext(TrainingContext);

  if (!value) {
    throw new Error("useTraining must be used inside TrainingProvider");
  }

  return value;
}
