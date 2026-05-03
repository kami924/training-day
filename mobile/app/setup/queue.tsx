import { useCallback, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { rhythm, typeRamp } from "@/constants/theme";
import { getExerciseById, getMuscleOption } from "@/data/exerciseSeed";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AppPalette, useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";
import { Exercise } from "@/types/training";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseIds(value: string | string[] | undefined) {
  const raw = readParam(value);
  return raw ? raw.split(",").filter(Boolean) : [];
}

function getExerciseName(exercise: Exercise, language: "zh" | "en") {
  return language === "zh" ? exercise.name.zh : exercise.name.en;
}

export default function ExerciseQueueScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    completed?: string;
    muscle?: string;
    selected?: string;
  }>();
  const { copy, language } = useLanguage();
  const { colors, muscleColors } = useAppTheme();
  const { activePlan, clearActivePlan, queueTodaySummary, setActivePlan } = useTraining();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const option = useMemo(
    () => getMuscleOption(activePlan?.muscleId ?? params.muscle),
    [activePlan?.muscleId, params.muscle],
  );
  const selectedIds = useMemo(
    () => activePlan?.selectedIds ?? parseIds(params.selected),
    [activePlan?.selectedIds, params.selected],
  );
  const completedIds = useMemo(
    () => activePlan?.completedIds ?? parseIds(params.completed),
    [activePlan?.completedIds, params.completed],
  );
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const selectedExercises = useMemo(
    () => selectedIds.map(getExerciseById).filter((item): item is Exercise => Boolean(item)),
    [selectedIds],
  );
  const doneCount = selectedExercises.filter((exercise) =>
    completedSet.has(exercise.id),
  ).length;
  const allDone = selectedExercises.length > 0 && doneCount === selectedExercises.length;

  const deleteExercise = useCallback(
    (exerciseId: string) => {
      const nextSelectedIds = selectedIds.filter((id) => id !== exerciseId);
      const nextCompletedIds = completedIds.filter((id) => id !== exerciseId);

      if (nextSelectedIds.length === 0) {
        clearActivePlan();
        router.replace("/setup/add" as never);
        return;
      }

      setActivePlan({
        completedIds: nextCompletedIds,
        customGroupLabel: activePlan?.customGroupLabel,
        muscleId: option.id,
        selectedIds: nextSelectedIds,
      });
    },
    [
      activePlan?.customGroupLabel,
      clearActivePlan,
      completedIds,
      option.id,
      selectedIds,
      setActivePlan,
    ],
  );

  return (
    <>
      <Stack.Screen
        options={{
          animation: "slide_from_right",
          animationMatchesGesture: true,
          fullScreenGestureEnabled: true,
          gestureEnabled: !allDone,
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          { paddingBottom: insets.bottom + 42, paddingTop: insets.top + 18 },
        ]}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.canvas }}
      >
      <Animated.View entering={FadeIn.duration(280)} style={styles.header}>
        {!allDone ? (
          <Pressable
            accessibilityLabel={copy.setup.back}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{copy.setup.queueTitle}</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(40).duration(220)}
        style={styles.summary}
      >
        <Text style={styles.body}>{copy.setup.queueBody}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {doneCount}/{selectedExercises.length} {copy.setup.completedCount}
          </Text>
          <View
            style={[
              styles.summaryRing,
              {
                borderColor: muscleColors[option.muscle],
                backgroundColor: `${muscleColors[option.muscle]}18`,
              },
            ]}
          />
        </View>
      </Animated.View>

      <View style={styles.list}>
        {selectedExercises.map((exercise, index) => {
          const completed = completedSet.has(exercise.id);

          return (
            <Animated.View
              entering={FadeIn.delay(80 + index * 24).duration(220)}
              key={exercise.id}
              layout={LinearTransition.springify().damping(22).stiffness(170)}
            >
              <QueueExerciseRow
                allDone={allDone}
                colors={colors}
                completed={completed}
                completedIds={completedIds}
                copy={copy}
                exercise={exercise}
                index={index}
                language={language}
                muscleColor={muscleColors[exercise.muscleGroup]}
                onDelete={deleteExercise}
                optionId={option.id}
                selectedIds={selectedIds}
              />
            </Animated.View>
          );
        })}
      </View>

      {allDone ? (
        <Animated.View
          entering={FadeIn.duration(220)}
          style={styles.doneBlock}
        >
          <Text style={styles.doneText}>{copy.setup.allDone}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              queueTodaySummary();
              clearActivePlan();
              router.dismissTo("/" as never);
            }}
            style={styles.finishButton}
          >
            <Text style={styles.finishText}>{copy.setup.finishWorkout}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
      </ScrollView>
    </>
  );
}

function QueueExerciseRow({
  allDone,
  colors,
  completed,
  completedIds,
  copy,
  exercise,
  index,
  language,
  muscleColor,
  onDelete,
  optionId,
  selectedIds,
}: {
  allDone: boolean;
  colors: AppPalette;
  completed: boolean;
  completedIds: string[];
  copy: ReturnType<typeof useLanguage>["copy"];
  exercise: Exercise;
  index: number;
  language: "zh" | "en";
  muscleColor: string;
  onDelete: (exerciseId: string) => void;
  optionId: string;
  selectedIds: string[];
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const swipeableRef = useRef<Swipeable | null>(null);

  const openConfig = useCallback(() => {
    router.push({
      pathname: "/setup/config",
      params: {
        completed: completedIds.join(","),
        exercise: exercise.id,
        index: String(index),
        muscle: optionId,
        selected: selectedIds.join(","),
      },
    } as never);
  }, [completedIds, exercise.id, index, optionId, selectedIds]);

  const deleteCurrent = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(exercise.id);
  }, [exercise.id, onDelete]);

  return (
    <Swipeable
      enabled={!completed && !allDone}
      friction={2.4}
      overshootRight={false}
      ref={swipeableRef}
      renderRightActions={() => (
        <View style={styles.swipeActionWrap}>
          <Pressable
            accessibilityLabel={copy.setup.deleteExercise}
            accessibilityRole="button"
            onPress={deleteCurrent}
            style={styles.deleteAction}
          >
            <DeleteIcon color="#FFFFFF" />
          </Pressable>
        </View>
      )}
      rightThreshold={40}
    >
      <Pressable
        accessibilityRole="button"
        disabled={completed || allDone}
        onPress={openConfig}
        style={[
          styles.card,
          completed && {
            backgroundColor: `${muscleColor}10`,
            borderColor: muscleColor,
          },
        ]}
      >
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleWrap}>
            <Text
              style={[
                styles.cardTitle,
                completed && styles.cardTitleCompleted,
              ]}
            >
              {getExerciseName(exercise, language)}
            </Text>
            {completed ? (
              <View
                style={[
                  styles.cardTitleStrike,
                  { backgroundColor: colors.ink },
                ]}
              />
            ) : null}
          </View>
          <Text style={styles.cardMeta}>
            {completed
              ? copy.setup.completed
              : exercise.customGroupLabel ?? copy.calendar.muscleNames[exercise.muscleGroup]}
          </Text>
        </View>
        <View
          style={[
            styles.statusRing,
            {
              borderColor: completed ? muscleColor : colors.ringTrack,
            },
          ]}
        >
          {completed ? (
            <View
              style={[
                styles.statusDot,
                { backgroundColor: muscleColor },
              ]}
            />
          ) : null}
        </View>
      </Pressable>
    </Swipeable>
  );
}

function DeleteIcon({ color }: { color: string }) {
  return (
    <Svg fill="none" height={32} viewBox="0 0 32 32" width={32}>
      <Path
        d="M10 10L22 22"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={3.2}
      />
      <Path
        d="M22 10L10 22"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={3.2}
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
    summary: {
      marginTop: 32,
    },
    body: {
      ...typeRamp.body,
      color: colors.muted,
    },
    progressRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 26,
    },
    progressText: {
      ...typeRamp.title,
      color: colors.ink,
    },
    summaryRing: {
      borderRadius: 24,
      borderWidth: 7,
      height: 48,
      width: 48,
    },
    list: {
      gap: 12,
      marginTop: 30,
    },
    swipeActionWrap: {
      justifyContent: "center",
      marginLeft: 14,
      width: 76,
    },
    deleteAction: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: "#FF5A52",
      borderRadius: 30,
      height: 60,
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      width: 60,
      elevation: 8,
    },
    card: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.hairline,
      borderRadius: 22,
      borderWidth: 1,
      flexDirection: "row",
      minHeight: 88,
      paddingHorizontal: 20,
    },
    cardCopy: {
      flex: 1,
    },
    cardTitleWrap: {
      alignSelf: "flex-start",
      justifyContent: "center",
      position: "relative",
    },
    cardTitle: {
      ...typeRamp.title,
      color: colors.ink,
    },
    cardTitleCompleted: {
      opacity: 0.62,
    },
    cardTitleStrike: {
      borderRadius: 999,
      height: 2,
      left: -2,
      opacity: 1,
      position: "absolute",
      right: -2,
      top: "52%",
    },
    cardMeta: {
      ...typeRamp.micro,
      color: colors.muted,
      marginTop: 4,
    },
    statusRing: {
      alignItems: "center",
      borderRadius: 16,
      borderWidth: 2,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    statusDot: {
      borderRadius: 7,
      height: 14,
      width: 14,
    },
    doneBlock: {
      borderColor: colors.hairline,
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 28,
      padding: 18,
    },
    doneText: {
      ...typeRamp.body,
      color: colors.ink,
      textAlign: "center",
    },
    finishButton: {
      alignItems: "center",
      backgroundColor: colors.ink,
      borderRadius: 18,
      marginTop: 16,
      minHeight: 52,
      justifyContent: "center",
    },
    finishText: {
      ...typeRamp.body,
      color: colors.canvas,
      fontWeight: "700",
    },
  });
}
