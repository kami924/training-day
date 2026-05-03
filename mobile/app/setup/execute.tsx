import { useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { rhythm, typeRamp } from "@/constants/theme";
import { getExerciseById, getMuscleOption } from "@/data/exerciseSeed";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AppPalette, useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseIds(value: string | string[] | undefined) {
  const raw = readParam(value);
  return raw ? raw.split(",").filter(Boolean) : [];
}

function parseNumber(value: string | string[] | undefined, fallback: number) {
  const raw = readParam(value);
  const parsed = raw ? Number(raw) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ExerciseExecutionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    completed?: string;
    exercise?: string;
    index?: string;
    muscle?: string;
    selected?: string;
    sets?: string;
    weight?: string;
  }>();
  const { copy, language } = useLanguage();
  const { colors, muscleColors } = useAppTheme();
  const { activePlan, recordExerciseCompletion, setCompletedExerciseIds } =
    useTraining();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const option = useMemo(
    () => getMuscleOption(activePlan?.muscleId ?? params.muscle),
    [activePlan?.muscleId, params.muscle],
  );
  const exercise = useMemo(() => getExerciseById(params.exercise), [params.exercise]);
  const targetSets = parseNumber(params.sets, 4);
  const targetWeight = parseNumber(params.weight, 0);
  const selectedIds = useMemo(
    () => activePlan?.selectedIds ?? parseIds(params.selected),
    [activePlan?.selectedIds, params.selected],
  );
  const completedIds = useMemo(
    () => activePlan?.completedIds ?? parseIds(params.completed),
    [activePlan?.completedIds, params.completed],
  );
  const currentIndex = parseNumber(params.index, 0);
  const [completedSets, setCompletedSets] = useState(0);
  const [done, setDone] = useState(false);
  const [lastSetEndedAt, setLastSetEndedAt] = useState<number | null>(null);
  const [elapsedRestSeconds, setElapsedRestSeconds] = useState(0);
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);
  const recordedRef = useRef(false);
  const title = exercise
    ? language === "zh"
      ? exercise.name.zh
      : exercise.name.en
    : copy.setup.exerciseTitle;
  const muscleColor = exercise ? muscleColors[exercise.muscleGroup] : colors.active;

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: (1 - pulse.value) * 0.42,
    transform: [{ scale: 1 + pulse.value * 0.22 }],
  }));
  const showRestTimer = !done && completedSets > 0;

  function goBackToConfig() {
    router.back();
  }

  useEffect(() => {
    if (!lastSetEndedAt || done) {
      return undefined;
    }

    const timer = setInterval(() => {
      const nextElapsed = Math.max(
        0,
        Math.floor((Date.now() - lastSetEndedAt) / 1000),
      );
      setElapsedRestSeconds(nextElapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [done, lastSetEndedAt]);

  useEffect(() => {
    if (!done || !exercise) {
      return undefined;
    }

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (!recordedRef.current) {
        recordExerciseCompletion({
          completedSets: targetSets,
          exercise,
          targetSets,
          targetWeight,
        });
        recordedRef.current = true;
      }

      const alreadyCompleted = completedIds.includes(exercise.id);
      const nextCompleted = alreadyCompleted ? completedIds : [...completedIds, exercise.id];

      if (!alreadyCompleted) {
        setCompletedExerciseIds(nextCompleted);
      }
    });

    const timer = setTimeout(() => {
      router.dismiss(2);
    }, 900);

    return () => {
      interactionHandle.cancel();
      clearTimeout(timer);
    };
  }, [
    done,
    exercise,
    completedIds,
    recordExerciseCompletion,
    setCompletedExerciseIds,
    targetSets,
    targetWeight,
  ]);

  function logSet() {
    if (done) {
      return;
    }

    const next = Math.min(completedSets + 1, targetSets);

    scale.value = withSequence(
      withTiming(0.958, {
        duration: 120,
        easing: Easing.out(Easing.cubic),
      }),
      withSpring(1.024, {
        damping: 15,
        stiffness: 118,
        mass: 1.14,
        velocity: 0.8,
      }),
      withSpring(1, {
        damping: 18,
        stiffness: 102,
        mass: 1.2,
      }),
    );
    pulse.value = 0;
    pulse.value = withSequence(
      withTiming(0.86, {
        duration: 190,
        easing: Easing.out(Easing.quad),
      }),
      withSpring(0, {
        damping: 17,
        stiffness: 88,
        mass: 1.24,
      }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    setCompletedSets(next);

    if (next >= targetSets) {
      setLastSetEndedAt(null);
      setElapsedRestSeconds(0);
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } else {
      setLastSetEndedAt(Date.now());
      setElapsedRestSeconds(0);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          animationMatchesGesture: true,
          fullScreenGestureEnabled: true,
          gestureEnabled: !done,
        }}
      />
      <View
        style={[
          styles.screen,
          { paddingBottom: insets.bottom + 38, paddingTop: insets.top + 18 },
        ]}
      >
      <Animated.View entering={FadeIn.duration(280)} style={styles.header}>
        <Pressable
          accessibilityLabel={copy.setup.back}
          onPress={goBackToConfig}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>
            {currentIndex + 1}/{Math.max(selectedIds.length, 1)}
          </Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(40).duration(220)}
        style={styles.targetRow}
      >
        <Text style={styles.targetText}>
          {targetSets} {copy.setup.sets} · {targetWeight} {copy.setup.kg}
        </Text>
      </Animated.View>

      <View style={styles.restSlot}>
        {showRestTimer ? (
          <Animated.View entering={FadeIn.delay(60).duration(220)} style={styles.restCard}>
            <Text style={styles.restLabel}>{copy.setup.restTimer}</Text>
            <Text style={styles.restValue}>{formatElapsed(elapsedRestSeconds)}</Text>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.center}>
        <View style={styles.buttonShell}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              {
                borderColor: muscleColor,
              },
              pulseStyle,
            ]}
          />
          <AnimatedPressable
            accessibilityRole="button"
            onPress={logSet}
            style={[
              styles.mainButton,
              {
                backgroundColor: done ? colors.ink : muscleColor,
              },
              buttonStyle,
            ]}
          >
            <Text style={[styles.mainText, { color: done ? colors.canvas : "#0B0B0D" }]}>
              {done ? copy.setup.done : `Set ${Math.min(completedSets + 1, targetSets)}`}
            </Text>
            {!done ? (
              <Text style={[styles.mainHint, { color: "#0B0B0D" }]}>
                {copy.setup.tapToLog}
              </Text>
            ) : null}
          </AnimatedPressable>
        </View>

        <View style={styles.dots}>
          {Array.from({ length: targetSets }).map((_, index) => {
            const active = index < completedSets;

            return (
              <ProgressDot
                active={active}
                color={muscleColor}
                key={index}
                trackColor={colors.ringTrack}
              />
            );
          })}
        </View>
      </View>
      </View>
    </>
  );
}

function ProgressDot({
  active,
  color,
  trackColor,
}: {
  active: boolean;
  color: string;
  trackColor: string;
}) {
  const dotScale = useSharedValue(active ? 1 : 0.82);

  useEffect(() => {
    dotScale.value = active
      ? withSequence(
          withSpring(1.45, { damping: 12, stiffness: 260 }),
          withSpring(1, { damping: 16, stiffness: 180 }),
        )
      : withSpring(0.82, { damping: 16, stiffness: 180 });
  }, [active, dotScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: active ? color : trackColor,
          borderRadius: 3,
          height: 6,
          width: 24,
        },
        animatedStyle,
      ]}
    />
  );
}

function makeStyles(colors: AppPalette) {
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      flex: 1,
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
    kicker: {
      ...typeRamp.caption,
      color: colors.muted,
    },
    title: {
      ...typeRamp.title,
      color: colors.ink,
      marginTop: 4,
    },
    targetRow: {
      marginTop: 32,
    },
    targetText: {
      ...typeRamp.body,
      color: colors.muted,
      textAlign: "center",
    },
    restSlot: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
      minHeight: 56,
    },
    restCard: {
      alignItems: "center",
    },
    restLabel: {
      ...typeRamp.micro,
      color: colors.muted,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    restValue: {
      color: colors.ink,
      fontSize: 28,
      fontWeight: "300",
      lineHeight: 32,
      marginTop: 8,
    },
    center: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    buttonShell: {
      alignItems: "center",
      height: 292,
      justifyContent: "center",
      position: "relative",
      width: 292,
    },
    pulseRing: {
      borderRadius: 146,
      borderWidth: 2,
      height: 292,
      position: "absolute",
      width: 292,
    },
    mainButton: {
      alignItems: "center",
      borderRadius: 126,
      height: 252,
      justifyContent: "center",
      width: 252,
    },
    mainText: {
      fontSize: 34,
      fontWeight: "700",
      lineHeight: 40,
      textAlign: "center",
    },
    mainHint: {
      ...typeRamp.micro,
      fontWeight: "700",
      marginTop: 10,
      opacity: 0.68,
      textAlign: "center",
    },
    dots: {
      flexDirection: "row",
      gap: 8,
      marginTop: 30,
    },
  });
}
