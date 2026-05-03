import { Exercise, MuscleGroup, MuscleGroupId } from "@/types/training";

export type MuscleOption = {
  id: MuscleGroupId;
  muscle: MuscleGroup;
};

export const muscleOptions: MuscleOption[] = [
  { id: "chest", muscle: "胸" },
  { id: "shoulder", muscle: "肩" },
  { id: "back", muscle: "背" },
  { id: "glutesLegs", muscle: "臀腿" },
  { id: "arms", muscle: "手臂" },
  { id: "abs", muscle: "腹部" },
  { id: "custom", muscle: "自定义" },
];

export const exercises: Exercise[] = [
  { id: "push-up", muscleGroup: "胸", name: { zh: "俯卧撑", en: "Push-Up" } },
  { id: "bench-press", muscleGroup: "胸", name: { zh: "卧推", en: "Bench Press" } },
  { id: "chest-fly", muscleGroup: "胸", name: { zh: "飞鸟", en: "Chest Fly" } },
  { id: "incline-bench-press", muscleGroup: "胸", name: { zh: "上斜卧推", en: "Incline Bench Press" } },
  { id: "incline-dumbbell-press", muscleGroup: "胸", name: { zh: "上斜哑铃卧推", en: "Incline Dumbbell Press" } },
  { id: "dumbbell-bench-press", muscleGroup: "胸", name: { zh: "哑铃卧推", en: "Dumbbell Bench Press" } },
  { id: "machine-chest-press", muscleGroup: "胸", name: { zh: "器械推胸", en: "Machine Chest Press" } },
  { id: "cable-fly", muscleGroup: "胸", name: { zh: "绳索夹胸", en: "Cable Fly" } },
  { id: "pec-deck-fly", muscleGroup: "胸", name: { zh: "蝴蝶机夹胸", en: "Pec Deck Fly" } },
  { id: "weighted-dip", muscleGroup: "胸", name: { zh: "双杠臂屈伸", en: "Weighted Dip" } },
  { id: "smith-bench-press", muscleGroup: "胸", name: { zh: "史密斯卧推", en: "Smith Bench Press" } },
  { id: "incline-dumbbell-fly", muscleGroup: "胸", name: { zh: "上斜哑铃飞鸟", en: "Incline Dumbbell Fly" } },
  { id: "shoulder-press", muscleGroup: "肩", name: { zh: "肩推", en: "Shoulder Press" } },
  { id: "lateral-raise", muscleGroup: "肩", name: { zh: "侧平举", en: "Lateral Raise" } },
  { id: "rear-delt-fly", muscleGroup: "肩", name: { zh: "反向飞鸟", en: "Rear Delt Fly" } },
  { id: "arnold-press", muscleGroup: "肩", name: { zh: "阿诺德推举", en: "Arnold Press" } },
  { id: "face-pull", muscleGroup: "肩", name: { zh: "面拉", en: "Face Pull" } },
  { id: "dumbbell-shoulder-press", muscleGroup: "肩", name: { zh: "哑铃肩推", en: "Dumbbell Shoulder Press" } },
  { id: "machine-shoulder-press", muscleGroup: "肩", name: { zh: "器械肩推", en: "Machine Shoulder Press" } },
  { id: "cable-lateral-raise", muscleGroup: "肩", name: { zh: "绳索侧平举", en: "Cable Lateral Raise" } },
  { id: "machine-rear-delt-fly", muscleGroup: "肩", name: { zh: "器械反向飞鸟", en: "Machine Rear Delt Fly" } },
  { id: "dumbbell-shrug", muscleGroup: "肩", name: { zh: "哑铃耸肩", en: "Dumbbell Shrug" } },
  { id: "pull-up", muscleGroup: "背", name: { zh: "引体向上", en: "Pull-Up" } },
  { id: "row", muscleGroup: "背", name: { zh: "划船", en: "Row" } },
  { id: "lat-pulldown", muscleGroup: "背", name: { zh: "高位下拉", en: "Lat Pulldown" } },
  { id: "barbell-row", muscleGroup: "背", name: { zh: "杠铃划船", en: "Barbell Row" } },
  { id: "seated-row", muscleGroup: "背", name: { zh: "坐姿划船", en: "Seated Row" } },
  { id: "single-arm-row", muscleGroup: "背", name: { zh: "单臂哑铃划船", en: "Single-Arm Row" } },
  { id: "straight-arm-pulldown", muscleGroup: "背", name: { zh: "直臂下压", en: "Straight-Arm Pulldown" } },
  { id: "deadlift", muscleGroup: "背", name: { zh: "硬拉", en: "Deadlift" } },
  { id: "machine-row", muscleGroup: "背", name: { zh: "器械划船", en: "Machine Row" } },
  { id: "assisted-pull-up", muscleGroup: "背", name: { zh: "辅助引体向上", en: "Assisted Pull-Up" } },
  { id: "t-bar-row", muscleGroup: "背", name: { zh: "T杠划船", en: "T-Bar Row" } },
  { id: "chest-supported-row", muscleGroup: "背", name: { zh: "胸托划船", en: "Chest-Supported Row" } },
  { id: "cable-row", muscleGroup: "背", name: { zh: "绳索划船", en: "Cable Row" } },
  { id: "rack-pull", muscleGroup: "背", name: { zh: "架上硬拉", en: "Rack Pull" } },
  { id: "squat", muscleGroup: "臀腿", name: { zh: "深蹲", en: "Squat" } },
  { id: "romanian-deadlift", muscleGroup: "臀腿", name: { zh: "罗马尼亚硬拉", en: "Romanian Deadlift" } },
  { id: "hip-thrust", muscleGroup: "臀腿", name: { zh: "臀推", en: "Hip Thrust" } },
  { id: "leg-press", muscleGroup: "臀腿", name: { zh: "腿举", en: "Leg Press" } },
  { id: "walking-lunge", muscleGroup: "臀腿", name: { zh: "行走弓步", en: "Walking Lunge" } },
  { id: "bulgarian-split-squat", muscleGroup: "臀腿", name: { zh: "保加利亚分腿蹲", en: "Bulgarian Split Squat" } },
  { id: "leg-extension", muscleGroup: "臀腿", name: { zh: "腿屈伸", en: "Leg Extension" } },
  { id: "leg-curl", muscleGroup: "臀腿", name: { zh: "腿弯举", en: "Leg Curl" } },
  { id: "calf-raise", muscleGroup: "臀腿", name: { zh: "提踵", en: "Calf Raise" } },
  { id: "hack-squat", muscleGroup: "臀腿", name: { zh: "哈克深蹲", en: "Hack Squat" } },
  { id: "goblet-squat", muscleGroup: "臀腿", name: { zh: "高脚杯深蹲", en: "Goblet Squat" } },
  { id: "reverse-lunge", muscleGroup: "臀腿", name: { zh: "后撤弓步", en: "Reverse Lunge" } },
  { id: "cable-kickback", muscleGroup: "臀腿", name: { zh: "绳索后踢腿", en: "Cable Kickback" } },
  { id: "glute-abduction", muscleGroup: "臀腿", name: { zh: "臀外展", en: "Glute Abduction" } },
  { id: "smith-split-squat", muscleGroup: "臀腿", name: { zh: "史密斯分腿蹲", en: "Smith Split Squat" } },
  { id: "seated-calf-raise", muscleGroup: "臀腿", name: { zh: "坐姿提踵", en: "Seated Calf Raise" } },
  { id: "curl", muscleGroup: "手臂", name: { zh: "弯举", en: "Curl" } },
  { id: "triceps-extension", muscleGroup: "手臂", name: { zh: "臂屈伸", en: "Triceps Extension" } },
  { id: "hammer-curl", muscleGroup: "手臂", name: { zh: "锤式弯举", en: "Hammer Curl" } },
  { id: "barbell-curl", muscleGroup: "手臂", name: { zh: "杠铃弯举", en: "Barbell Curl" } },
  { id: "preacher-curl", muscleGroup: "手臂", name: { zh: "牧师凳弯举", en: "Preacher Curl" } },
  { id: "cable-curl", muscleGroup: "手臂", name: { zh: "绳索弯举", en: "Cable Curl" } },
  { id: "skull-crusher", muscleGroup: "手臂", name: { zh: "仰卧臂屈伸", en: "Skull Crusher" } },
  { id: "rope-pushdown", muscleGroup: "手臂", name: { zh: "绳索下压", en: "Rope Pushdown" } },
  { id: "concentration-curl", muscleGroup: "手臂", name: { zh: "集中弯举", en: "Concentration Curl" } },
  { id: "incline-dumbbell-curl", muscleGroup: "手臂", name: { zh: "上斜哑铃弯举", en: "Incline Dumbbell Curl" } },
  { id: "overhead-triceps-extension", muscleGroup: "手臂", name: { zh: "过顶臂屈伸", en: "Overhead Triceps Extension" } },
  { id: "cable-overhead-extension", muscleGroup: "手臂", name: { zh: "绳索过顶臂屈伸", en: "Cable Overhead Extension" } },
  { id: "crunch", muscleGroup: "腹部", name: { zh: "卷腹", en: "Crunch" } },
  { id: "plank", muscleGroup: "腹部", name: { zh: "平板支撑", en: "Plank" } },
  { id: "leg-raise", muscleGroup: "腹部", name: { zh: "举腿", en: "Leg Raise" } },
  { id: "russian-twist", muscleGroup: "腹部", name: { zh: "俄罗斯转体", en: "Russian Twist" } },
  { id: "sit-up", muscleGroup: "腹部", name: { zh: "仰卧起坐", en: "Sit-Up" } },
  { id: "bicycle-crunch", muscleGroup: "腹部", name: { zh: "空中蹬车", en: "Bicycle Crunch" } },
  { id: "mountain-climber", muscleGroup: "腹部", name: { zh: "登山跑", en: "Mountain Climber" } },
  { id: "ab-wheel", muscleGroup: "腹部", name: { zh: "健腹轮", en: "Ab Wheel Rollout" } },
  { id: "cable-crunch", muscleGroup: "腹部", name: { zh: "绳索卷腹", en: "Cable Crunch" } },
  { id: "hanging-knee-raise", muscleGroup: "腹部", name: { zh: "悬垂举膝", en: "Hanging Knee Raise" } },
  { id: "side-plank", muscleGroup: "腹部", name: { zh: "侧桥", en: "Side Plank" } },
  { id: "hanging-leg-raise", muscleGroup: "腹部", name: { zh: "悬垂举腿", en: "Hanging Leg Raise" } },
];

export function getMuscleOption(id: string | string[] | undefined) {
  const rawId = Array.isArray(id) ? id[0] : id;
  return muscleOptions.find((option) => option.id === rawId) ?? muscleOptions[0];
}

export function getExercisesByMuscle(muscle: MuscleGroup) {
  return exercises.filter((exercise) => exercise.muscleGroup === muscle);
}

export function getExerciseById(id: string | string[] | undefined) {
  const rawId = Array.isArray(id) ? id[0] : id;
  if (rawId?.startsWith("custom:")) {
    const encodedPayload = rawId.slice(7);
    const separatorIndex = encodedPayload.indexOf("::");

    if (separatorIndex >= 0) {
      const customGroupLabel = decodeURIComponent(
        encodedPayload.slice(0, separatorIndex),
      );
      const exerciseName = decodeURIComponent(
        encodedPayload.slice(separatorIndex + 2),
      );

      return createCustomExercise(exerciseName, customGroupLabel);
    }

    return createCustomExercise(decodeURIComponent(encodedPayload));
  }
  return exercises.find((exercise) => exercise.id === rawId);
}

export function createCustomExercise(
  name: string,
  customGroupLabel?: string,
): Exercise {
  const trimmed = name.trim();
  const trimmedGroupLabel = customGroupLabel?.trim();
  const encodedId = trimmedGroupLabel
    ? `custom:${encodeURIComponent(trimmedGroupLabel)}::${encodeURIComponent(trimmed)}`
    : `custom:${encodeURIComponent(trimmed)}`;

  return {
    customGroupLabel: trimmedGroupLabel,
    id: encodedId,
    muscleGroup: "自定义",
    name: {
      zh: trimmed,
      en: trimmed,
    },
  };
}
