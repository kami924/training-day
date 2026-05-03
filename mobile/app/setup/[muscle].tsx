import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { rhythm, typeRamp } from "@/constants/theme";
import {
  createCustomExercise,
  getExerciseById,
  getExercisesByMuscle,
  getMuscleOption,
} from "@/data/exerciseSeed";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AppPalette, useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";
import { Exercise, MuscleGroupId } from "@/types/training";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const commonExerciseIdsByMuscle: Partial<Record<MuscleGroupId, string[]>> = {
  chest: ["push-up", "bench-press", "incline-bench-press", "dumbbell-bench-press"],
  shoulder: ["shoulder-press", "lateral-raise", "rear-delt-fly", "face-pull"],
  back: ["pull-up", "lat-pulldown", "row", "deadlift"],
  glutesLegs: ["squat", "hip-thrust", "leg-press", "romanian-deadlift"],
  arms: ["barbell-curl", "hammer-curl", "rope-pushdown", "triceps-extension"],
  abs: ["crunch", "plank", "leg-raise", "russian-twist"],
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseRouteIds(value: string | string[] | undefined) {
  const raw = readParam(value);
  return raw ? raw.split(",").filter(Boolean) : [];
}

export default function ExerciseSetupScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    completed?: string;
    mode?: string;
    muscle: string;
    selected?: string;
  }>();
  const { copy, language } = useLanguage();
  const { colors, muscleColors } = useAppTheme();
  const { activePlan, favoriteExerciseIds, setActivePlan, toggleFavoriteExercise } =
    useTraining();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const option = useMemo(() => getMuscleOption(params.muscle), [params.muscle]);
  const exerciseList = useMemo(
    () => getExercisesByMuscle(option.muscle),
    [option.muscle],
  );
  const isCustomMode = option.id === "custom";
  const existingSelectedIds = useMemo(
    () => activePlan?.selectedIds ?? parseRouteIds(params.selected),
    [activePlan?.selectedIds, params.selected],
  );
  const completedIds = useMemo(
    () => activePlan?.completedIds ?? parseRouteIds(params.completed),
    [activePlan?.completedIds, params.completed],
  );
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const isAddMode = params.mode === "add" && existingSelectedIds.length > 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [customGroupName, setCustomGroupName] = useState(
    isCustomMode ? activePlan?.customGroupLabel ?? "" : "",
  );
  const [customName, setCustomName] = useState("");
  const selectedCount = selectedExerciseIds.length;
  const filteredExercises = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) {
      return exerciseList;
    }

    return exerciseList.filter((exercise) => {
      const zhName = exercise.name.zh.toLowerCase();
      const enName = exercise.name.en.toLowerCase();

      return zhName.includes(keyword) || enName.includes(keyword);
    });
  }, [exerciseList, searchQuery]);
  const orderedExercises = useMemo(() => {
    const commonExerciseIds = commonExerciseIdsByMuscle[option.id] ?? [];
    const commonSet = new Set(commonExerciseIds);
    const sourceOrder = new Map(
      exerciseList.map((exercise, index) => [exercise.id, index]),
    );

    return [...filteredExercises].sort((left, right) => {
      const leftIsExisting = existingSelectedIds.includes(left.id);
      const rightIsExisting = existingSelectedIds.includes(right.id);

      if (leftIsExisting !== rightIsExisting) {
        return leftIsExisting ? -1 : 1;
      }

      const leftIsFavorite = favoriteExerciseIds.includes(left.id);
      const rightIsFavorite = favoriteExerciseIds.includes(right.id);

      if (leftIsFavorite !== rightIsFavorite) {
        return leftIsFavorite ? -1 : 1;
      }

      const leftIsCommon = commonSet.has(left.id);
      const rightIsCommon = commonSet.has(right.id);

      if (leftIsCommon !== rightIsCommon) {
        return leftIsCommon ? -1 : 1;
      }

      return (sourceOrder.get(left.id) ?? 0) - (sourceOrder.get(right.id) ?? 0);
    });
  }, [
    existingSelectedIds,
    exerciseList,
    favoriteExerciseIds,
    filteredExercises,
    option.id,
  ]);

  function openQueue(nextSelectedIds: string[]) {
    const queueParams = {
      completed: completedIds.join(","),
      muscle: option.id,
      selected: nextSelectedIds.join(","),
    };

    setActivePlan({
      completedIds,
      customGroupLabel: isCustomMode ? customGroupName.trim() || undefined : undefined,
      muscleId: option.id,
      selectedIds: nextSelectedIds,
    });

    router.push({
      pathname: "/setup/queue",
      params: queueParams,
    } as never, { withAnchor: true });
  }

  function toggleExercise(exerciseId: string) {
    if (existingSelectedIds.includes(exerciseId)) {
      return;
    }

    setSelectedExerciseIds((current) => {
      if (current.includes(exerciseId)) {
        return current.filter((id) => id !== exerciseId);
      }

      return [...current, exerciseId];
    });
  }

  function addCustomExercise() {
    const trimmedGroupName = customGroupName.trim();
    const trimmed = customName.trim();

    if (!trimmedGroupName || !trimmed) {
      return;
    }

    const customExercise = createCustomExercise(trimmed, trimmedGroupName);

    if (existingSelectedIds.includes(customExercise.id)) {
      setCustomName("");
      return;
    }

    setSelectedExerciseIds((current) => {
      if (current.includes(customExercise.id)) {
        return current;
      }

      return [...current, customExercise.id];
    });
    setCustomName("");
  }

  const customExercises = useMemo(
    () => selectedExerciseIds.map(getExerciseById).filter((item): item is Exercise => Boolean(item)),
    [selectedExerciseIds],
  );

  useEffect(() => {
    if (!isCustomMode || !customGroupName.trim() || !selectedExerciseIds.length) {
      return;
    }

    setSelectedExerciseIds((current) => {
      const nextIds = current.map((id) => {
        const exercise = getExerciseById(id);

        if (!exercise) {
          return id;
        }

        return createCustomExercise(exercise.name.zh, customGroupName.trim()).id;
      });

      const didChange = nextIds.some((id, index) => id !== current[index]);
      return didChange ? nextIds : current;
    });
  }, [customGroupName, isCustomMode, selectedExerciseIds.length]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.screen,
        { paddingBottom: insets.bottom + 42, paddingTop: insets.top + 18 },
      ]}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.canvas }}
    >
      <Animated.View entering={FadeIn.duration(280)} style={styles.header}>
        <Pressable
          accessibilityLabel={copy.setup.back}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{copy.calendar.muscleNames[option.muscle]}</Text>
        </View>
        <View
          style={[
            styles.headerRing,
            {
              borderColor: muscleColors[option.muscle],
              backgroundColor: `${muscleColors[option.muscle]}22`,
            },
          ]}
        />
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(40).duration(220)}
        style={styles.copyBlock}
      >
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {isCustomMode
              ? copy.setup.customTitle
              : isAddMode
                ? copy.setup.addExerciseTitle
                : copy.setup.exerciseTitle}
          </Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {selectedCount} {copy.setup.selectedCount}
            </Text>
          </View>
        </View>
        <Text style={styles.body}>
          {isCustomMode
            ? copy.setup.customBody
            : isAddMode
              ? copy.setup.addExerciseBody
              : copy.setup.exerciseBody}
        </Text>
      </Animated.View>

      {isCustomMode ? (
        <>
          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <TextInput
              onChangeText={setCustomGroupName}
              placeholder={copy.setup.customThemePlaceholder}
              placeholderTextColor={colors.quiet}
              selectionColor={muscleColors[option.muscle]}
              style={[styles.searchInput, { color: colors.ink }]}
              value={customGroupName}
            />
          </View>
          <View
            style={[
              styles.searchWrap,
              styles.customExerciseWrap,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <TextInput
              onChangeText={setCustomName}
              placeholder={copy.setup.customPlaceholder}
              placeholderTextColor={colors.quiet}
              selectionColor={muscleColors[option.muscle]}
              style={[styles.searchInput, { color: colors.ink }]}
              value={customName}
            />
            <Pressable
              accessibilityRole="button"
              onPress={addCustomExercise}
              style={[
                styles.customAddButton,
                { backgroundColor: muscleColors[option.muscle] },
              ]}
            >
              <Text style={styles.customAddText}>＋</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.surface, borderColor: colors.hairline },
          ]}
        >
          <Text style={[styles.searchIcon, { color: colors.quiet }]}>⌕</Text>
          <TextInput
            onChangeText={setSearchQuery}
            placeholder={copy.setup.searchPlaceholder}
            placeholderTextColor={colors.quiet}
            selectionColor={muscleColors[option.muscle]}
            style={[styles.searchInput, { color: colors.ink }]}
            value={searchQuery}
          />
          {searchQuery ? (
            <Pressable
              accessibilityLabel={copy.setup.clearSearch}
              accessibilityRole="button"
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchButton}
            >
              <Text style={[styles.clearSearchText, { color: colors.quiet }]}>×</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <View style={styles.exerciseList}>
        {isCustomMode ? (
          customExercises.length ? (
            customExercises.map((exercise, index) => (
              <ExerciseCard
                exercise={exercise}
                disabled={false}
                favorite={false}
                index={index}
                key={exercise.id}
              completed={completedSet.has(exercise.id)}
              onToggleFavorite={() => undefined}
              selected
              showFavorite={false}
              onSelect={() => toggleExercise(exercise.id)}
            />
            ))
          ) : (
            <View
              style={[
                styles.emptySearch,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <Text style={[styles.emptySearchText, { color: colors.muted }]}>
                {copy.setup.customEmpty}
              </Text>
            </View>
          )
        ) : orderedExercises.length ? (
          orderedExercises.map((exercise, index) => (
            <ExerciseCard
              exercise={exercise}
              disabled={existingSelectedIds.includes(exercise.id)}
              favorite={favoriteExerciseIds.includes(exercise.id)}
              index={index}
              key={exercise.id}
              completed={completedSet.has(exercise.id)}
              onToggleFavorite={() => toggleFavoriteExercise(exercise.id)}
              selected={selectedExerciseIds.includes(exercise.id)}
              showFavorite
              onSelect={() => toggleExercise(exercise.id)}
            />
          ))
        ) : (
          <View
            style={[
              styles.emptySearch,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <Text style={[styles.emptySearchText, { color: colors.muted }]}>
              {copy.setup.noSearchResult}
            </Text>
          </View>
        )}
      </View>

      <AnimatedPressable
        accessibilityRole="button"
        onPress={() => {
          if (!selectedExerciseIds.length || (isCustomMode && !customGroupName.trim())) {
            return;
          }

          const nextSelectedIds = Array.from(
            new Set([...existingSelectedIds, ...selectedExerciseIds]),
          );

          openQueue(nextSelectedIds);
        }}
        style={[
          styles.nextNotice,
          (!selectedExerciseIds.length || (isCustomMode && !customGroupName.trim())) &&
            styles.nextNoticeDisabled,
          {
            borderColor: muscleColors[option.muscle],
            backgroundColor: `${muscleColors[option.muscle]}18`,
          },
        ]}
      >
        <Text style={styles.nextNoticeText}>{copy.setup.continue}</Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

function ExerciseCard({
  completed,
  disabled,
  exercise,
  favorite,
  index,
  onSelect,
  onToggleFavorite,
  selected,
  showFavorite,
}: {
  completed: boolean;
  disabled: boolean;
  exercise: Exercise;
  favorite: boolean;
  index: number;
  onSelect: () => void;
  onToggleFavorite: () => void;
  selected: boolean;
  showFavorite: boolean;
}) {
  const { copy, language } = useLanguage();
  const { colors, muscleColors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useSharedValue(1);
  const title = language === "zh" ? exercise.name.zh : exercise.name.en;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onSelect}
      onPressIn={() => {
        scale.value = withSpring(0.982, { damping: 18, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 190 });
      }}
      style={[
        styles.exerciseCard,
        {
          backgroundColor: selected
            ? `${muscleColors[exercise.muscleGroup]}12`
            : colors.surface,
          borderColor:
            selected || disabled ? muscleColors[exercise.muscleGroup] : colors.hairline,
          opacity: disabled ? 0.56 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.exerciseCopy}>
        <Text style={styles.exerciseName}>{title}</Text>
        <Text style={styles.exerciseMeta}>
          {completed
            ? copy.setup.completed
            : selected || disabled
              ? copy.setup.selected
              : favorite
                ? copy.setup.favorited
                : exercise.customGroupLabel ?? copy.calendar.muscleNames[exercise.muscleGroup]}
        </Text>
      </View>
      {showFavorite ? (
        <Pressable
          accessibilityLabel={
            favorite ? copy.setup.unfavoriteExercise : copy.setup.favoriteExercise
          }
          accessibilityRole="button"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          style={styles.favoriteButton}
        >
          <FavoriteIcon
            active={favorite}
            color={favorite ? muscleColors[exercise.muscleGroup] : colors.quiet}
          />
        </Pressable>
      ) : null}
      <View
        style={[
          styles.selectionRing,
          {
            borderColor:
              selected || disabled ? muscleColors[exercise.muscleGroup] : colors.ringTrack,
          },
        ]}
      >
        {selected || disabled ? (
          <View
            style={[
              styles.selectionDot,
              { backgroundColor: muscleColors[exercise.muscleGroup] },
            ]}
          />
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

function FavoriteIcon({
  active,
  color,
}: {
  active: boolean;
  color: string;
}) {
  return (
    <Svg fill="none" height={20} viewBox="0 0 24 24" width={20}>
      <Path
        d="M12 3.9L14.15 8.26L18.96 8.96L15.48 12.35L16.3 17.14L12 14.88L7.7 17.14L8.52 12.35L5.04 8.96L9.85 8.26L12 3.9Z"
        fill={active ? color : "transparent"}
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function makeStyles(colors: AppPalette) {
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      paddingHorizontal: rhythm.page,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
    },
    backButton: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.hairline,
      borderRadius: 20,
      borderWidth: 1,
      height: 40,
      justifyContent: "center",
      marginRight: 16,
      width: 40,
    },
    backText: {
      color: colors.ink,
      fontSize: 30,
      fontWeight: "200",
      lineHeight: 32,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      ...typeRamp.display,
      color: colors.ink,
      marginTop: 4,
    },
    headerRing: {
      borderRadius: 24,
      borderWidth: 7,
      height: 48,
      marginLeft: 14,
      width: 48,
    },
    copyBlock: {
      marginTop: 34,
    },
    sectionTitle: {
      ...typeRamp.title,
      color: colors.ink,
    },
    sectionTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    countPill: {
      backgroundColor: colors.surface,
      borderColor: colors.hairline,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    countText: {
      ...typeRamp.micro,
      color: colors.muted,
      fontWeight: "700",
    },
    body: {
      ...typeRamp.body,
      color: colors.muted,
      marginTop: 8,
    },
    customExerciseWrap: {
      marginTop: 12,
    },
    searchWrap: {
      alignItems: "center",
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      height: 52,
      marginTop: 22,
      paddingHorizontal: 14,
    },
    searchIcon: {
      fontSize: 16,
      marginRight: 10,
    },
    searchInput: {
      ...typeRamp.body,
      flex: 1,
      height: 20,
      lineHeight: 20,
      paddingBottom: 0,
      paddingTop: 0,
      textAlignVertical: "center",
    },
    clearSearchButton: {
      alignItems: "center",
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    clearSearchText: {
      fontSize: 22,
      fontWeight: "300",
      lineHeight: 22,
    },
    customAddButton: {
      alignItems: "center",
      borderRadius: 14,
      height: 34,
      justifyContent: "center",
      marginLeft: 10,
      width: 34,
    },
    customAddText: {
      color: "#0B0B0D",
      fontSize: 22,
      fontWeight: "500",
      lineHeight: 22,
      marginTop: -1,
    },
    exerciseList: {
      gap: 12,
      marginTop: 30,
    },
    emptySearch: {
      alignItems: "center",
      borderRadius: 20,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 108,
      paddingHorizontal: 20,
    },
    emptySearchText: {
      ...typeRamp.body,
      textAlign: "center",
    },
    exerciseCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      flexDirection: "row",
      minHeight: 88,
      paddingHorizontal: 20,
    },
    exerciseCopy: {
      flex: 1,
    },
    exerciseName: {
      ...typeRamp.title,
      color: colors.ink,
    },
    exerciseMeta: {
      ...typeRamp.micro,
      color: colors.muted,
      marginTop: 4,
    },
    favoriteButton: {
      alignItems: "center",
      height: 34,
      justifyContent: "center",
      marginRight: 10,
      width: 34,
    },
    selectionRing: {
      alignItems: "center",
      borderRadius: 16,
      borderWidth: 2,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    selectionDot: {
      borderRadius: 7,
      height: 14,
      width: 14,
    },
    nextNotice: {
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 28,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    nextNoticeDisabled: {
      opacity: 0.42,
    },
    nextNoticeText: {
      ...typeRamp.body,
      color: colors.ink,
      textAlign: "center",
    },
  });
}
