import { exercises } from "@/data/exerciseSeed";
import {
  Exercise,
  ImportedWorkoutRow,
  MuscleGroup,
  WorkoutImportDraft,
} from "@/types/training";

const headerAliases = {
  date: ["date", "日期", "训练日期", "day", "time", "时间"],
  exercise: ["exercise", "动作", "动作名称", "name", "exercise name", "项目"],
  sets: ["sets", "组数", "set", "目标组数"],
  weight: ["weight", "重量", "kg", "load", "训练重量"],
  reps: ["reps", "次数", "rep", "目标次数"],
  status: ["status", "状态", "完成情况", "completed", "是否完成"],
} as const;

const exerciseNameLookup = new Map<string, Exercise>(
  exercises.flatMap((exercise) => [
    [normalizeKey(exercise.name.zh), exercise] as const,
    [normalizeKey(exercise.name.en), exercise] as const,
  ]),
);

type FieldKey = keyof typeof headerAliases;

type ImportColumns = Partial<Record<FieldKey, number>>;

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function detectDelimiter(line: string) {
  const delimiters = [",", "\t", ";"];
  const scores = delimiters.map((delimiter) => ({
    count: line.split(delimiter).length,
    delimiter,
  }));

  return scores.sort((left, right) => right.count - left.count)[0]?.delimiter ?? ",";
}

function splitRow(line: string, delimiter: string) {
  if (!line.includes('"')) {
    return line.split(delimiter).map((cell) => cell.trim());
  }

  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function buildColumns(headers: string[]): { columns: ImportColumns; hasHeader: boolean } {
  const columns: ImportColumns = {};
  let matchedCount = 0;

  headers.forEach((header, index) => {
    const normalized = normalizeKey(header);

    (Object.keys(headerAliases) as FieldKey[]).forEach((field) => {
      if (
        (headerAliases[field] as readonly string[]).includes(normalized) &&
        columns[field] === undefined
      ) {
        columns[field] = index;
        matchedCount += 1;
      }
    });
  });

  return {
    columns,
    hasHeader: matchedCount >= 2,
  };
}

function fallbackColumns(cells: string[]): ImportColumns {
  const columns: ImportColumns = {
    date: 0,
    exercise: 1,
    sets: 2,
    weight: 3,
  };

  if (cells.length >= 5) {
    columns.reps = 4;
  }

  if (cells.length >= 6) {
    columns.status = 5;
  }

  return columns;
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const cleaned = value.replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  const normalized = raw.trim().replace(/[./]/g, "-").replace(/\s+/g, "");
  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function inferMuscleGroup(exerciseName: string): MuscleGroup {
  const known = exerciseNameLookup.get(normalizeKey(exerciseName));

  if (known) {
    return known.muscleGroup;
  }

  const text = exerciseName.toLowerCase();

  if (
    /卧推|飞鸟|夹胸|俯卧撑|push-up|bench|chest|pec|dip/.test(text)
  ) {
    return "胸";
  }

  if (
    /肩|推举|侧平举|后束|面拉|arnold|lateral|shoulder|rear delt|shrug/.test(text)
  ) {
    return "肩";
  }

  if (
    /引体|划船|下拉|硬拉|pull|row|deadlift|lat|背/.test(text)
  ) {
    return "背";
  }

  if (
    /深蹲|臀|腿|弓步|提踵|leg|squat|lunge|hip thrust|臀腿|calf/.test(text)
  ) {
    return "臀腿";
  }

  if (
    /弯举|臂屈伸|下压|curl|triceps|biceps|hammer/.test(text)
  ) {
    return "手臂";
  }

  return "腹部";
}

function normalizeExerciseName(raw: string | undefined) {
  return raw?.trim() ?? "";
}

function parseLooseWorkoutLine(line: string, index: number) {
  const dateMatch = line.match(/(20\d{2}[./-]\d{1,2}[./-]\d{1,2})/);

  if (!dateMatch) {
    return null;
  }

  const date = parseDate(dateMatch[1]);

  if (!date) {
    return null;
  }

  const tail = line
    .replace(dateMatch[1], "")
    .replace(/^[\s,，|:：-]+/, "")
    .trim();

  if (!tail) {
    return null;
  }

  let completedSets = 0;
  let targetWeight = 0;
  let rawStatus = "done";
  let exerciseSource = tail;

  const pairMatch = tail.match(/(\d+(?:\.\d+)?)\s*[x×＊*]\s*(\d+(?:\.\d+)?)\s*(kg|公斤)?/i);
  if (pairMatch) {
    completedSets = Number(pairMatch[1]);
    targetWeight = Number(pairMatch[2]);
    exerciseSource = exerciseSource.replace(pairMatch[0], " ");
  }

  const setsMatch = tail.match(/(\d+(?:\.\d+)?)\s*(组|sets?|set)\b/i);
  if (setsMatch) {
    completedSets = Number(setsMatch[1]);
    exerciseSource = exerciseSource.replace(setsMatch[0], " ");
  }

  const weightMatch = tail.match(/(\d+(?:\.\d+)?)\s*(kg|公斤)\b/i);
  if (weightMatch) {
    targetWeight = Number(weightMatch[1]);
    exerciseSource = exerciseSource.replace(weightMatch[0], " ");
  }

  const repsMatch = tail.match(/(\d+(?:\.\d+)?)\s*(次|reps?|rep)\b/i);
  if (repsMatch) {
    rawStatus = `${repsMatch[1]} reps`;
    exerciseSource = exerciseSource.replace(repsMatch[0], " ");
  }

  const bareNumbers = Array.from(
    tail.matchAll(/(\d+(?:\.\d+)?)/g),
    (match) => Number(match[1]),
  ).filter((value) => Number.isFinite(value));

  if (!completedSets && bareNumbers.length) {
    completedSets = bareNumbers[0];
  }

  if (!targetWeight && bareNumbers.length >= 2) {
    targetWeight = bareNumbers[1];
  }

  const exerciseName = normalizeExerciseName(
    exerciseSource
      .replace(/(\d+(?:\.\d+)?)/g, " ")
      .replace(/\b(kg|公斤|组|sets?|set|次|reps?|rep)\b/gi, " ")
      .replace(/[x×＊*]/g, " ")
      .replace(/[,:：;；|/\\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  if (!exerciseName) {
    return null;
  }

  return {
    completedSets: Math.max(1, completedSets),
    date,
    exerciseName,
    id: `${date}-${exerciseName}-${index}`,
    muscleGroup: inferMuscleGroup(exerciseName),
    rawStatus,
    targetWeight: Math.max(0, targetWeight),
  } satisfies ImportedWorkoutRow;
}

function formatCanonicalRow(row: ImportedWorkoutRow) {
  const weightLabel = row.targetWeight > 0 ? `${row.targetWeight}kg` : "自重";
  return `${row.date} ${row.exerciseName} ${row.completedSets}组 ${weightLabel}`;
}

export function curateWorkoutImportText(text: string) {
  const normalized = text
    .replace(/\r/g, "")
    .replace(/[|｜]/g, " ")
    .replace(/[，]/g, ",")
    .replace(/[：]/g, ":")
    .replace(/[；]/g, ";")
    .replace(/\n{3,}/g, "\n\n");

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: ImportedWorkoutRow[] = [];
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    const candidates = [line];

    if (index < lines.length - 1) {
      candidates.push(`${line} ${lines[index + 1]}`);
    }

    for (const candidate of candidates) {
      try {
        const parsed = parseWorkoutImportText(candidate, "text");
        parsed.rows.forEach((row) => {
          const key = `${row.date}-${normalizeKey(row.exerciseName)}-${row.completedSets}-${row.targetWeight}`;

          if (!seen.has(key)) {
            seen.add(key);
            rows.push(row);
          }
        });
        break;
      } catch {
        continue;
      }
    }
  });

  return {
    rows,
    text: rows.map(formatCanonicalRow).join("\n"),
  };
}

export function parseWorkoutImportText(
  text: string,
  source: WorkoutImportDraft["source"],
  fileName?: string,
): WorkoutImportDraft {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("没有读取到可导入内容");
  }

  const delimiter = detectDelimiter(lines[0]);
  const firstRow = splitRow(lines[0], delimiter);
  const { columns: detectedColumns, hasHeader } = buildColumns(firstRow);
  const columns = hasHeader ? detectedColumns : fallbackColumns(firstRow);
  const contentLines = hasHeader ? lines.slice(1) : lines;

  const rows: ImportedWorkoutRow[] = contentLines
    .map((line, index) => {
      const cells = splitRow(line, delimiter);

      if (cells.length <= 1) {
        return parseLooseWorkoutLine(line, index);
      }

      const date = parseDate(cells[columns.date ?? 0]);
      const exerciseName = normalizeExerciseName(cells[columns.exercise ?? 1]);

      if (!date || !exerciseName) {
        return parseLooseWorkoutLine(line, index);
      }

      const completedSets = Math.max(1, parseNumber(cells[columns.sets ?? 2]));
      const targetWeight = Math.max(0, parseNumber(cells[columns.weight ?? 3]));
      const rawStatus = cells[columns.status ?? -1] ?? "done";

      return {
        completedSets,
        date,
        exerciseName,
        id: `${date}-${exerciseName}-${index}`,
        muscleGroup: inferMuscleGroup(exerciseName),
        rawStatus,
        targetWeight,
      } satisfies ImportedWorkoutRow;
    })
    .filter((row): row is ImportedWorkoutRow => Boolean(row));

  if (!rows.length) {
    throw new Error("没有识别到有效训练记录");
  }

  return {
    fileName,
    rows,
    source,
  };
}
