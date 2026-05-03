import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { rhythm, typeRamp } from "@/constants/theme";
import { getExercisesByMuscle, muscleOptions, MuscleOption } from "@/data/exerciseSeed";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AppPalette, useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MuscleSetupScreen({
  forceAddMode = false,
}: {
  forceAddMode?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    completed?: string;
    mode?: string;
    muscle?: string;
    selected?: string;
  }>();
  const { copy } = useLanguage();
  const { colors } = useAppTheme();
  const { activePlan, clearActivePlan } = useTraining();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isAddMode = forceAddMode || params.mode === "add";
  const completedParam = activePlan?.completedIds.join(",") ?? (readParam(params.completed) ?? "");
  const muscleParam = activePlan?.muscleId ?? (readParam(params.muscle) ?? "chest");
  const selectedParam = activePlan?.selectedIds.join(",") ?? (readParam(params.selected) ?? "");
  const nextModeParam = isAddMode ? "add" : readParam(params.mode) ?? "";

  function goBack() {
    if (isAddMode) {
      if (!activePlan?.selectedIds.length) {
        clearActivePlan();
      }
      router.dismissTo("/" as never);
      return;
    }

    router.back();
  }

  function enterQueue() {
    router.push({
      pathname: "/setup/queue",
      params: {
        completed: completedParam,
        muscle: muscleParam,
        selected: selectedParam,
      },
    } as never);
  }

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
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>
              {isAddMode ? copy.setup.addExerciseTitle : copy.setup.title}
            </Text>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(40).duration(220)}
          style={styles.body}
        >
          {isAddMode ? copy.setup.addExerciseBody : copy.setup.body}
        </Animated.Text>

        <View style={styles.grid}>
          {muscleOptions.map((option, index) => (
            <MuscleCard
              completed={completedParam}
              key={option.id}
              mode={nextModeParam}
              option={option}
              index={index}
              selected={selectedParam}
            />
          ))}
        </View>

        {isAddMode ? (
          <Pressable
            accessibilityRole="button"
            onPress={enterQueue}
            style={[styles.enterQueueButton, { backgroundColor: colors.active }]}
          >
            <Text style={[styles.enterQueueText, { color: colors.canvas }]}>
              {copy.setup.enterTraining}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
  );
}

export default function SetupIndexRoute() {
  return <MuscleSetupScreen />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function MuscleCard({
  completed,
  index,
  mode,
  option,
  selected,
}: {
  completed: string;
  index: number;
  mode: string;
  option: MuscleOption;
  selected: string;
}) {
  const { copy } = useLanguage();
  const { colors, muscleColors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useSharedValue(1);
  const exerciseCount =
    option.id === "custom" ? null : getExercisesByMuscle(option.muscle).length;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/setup/[muscle]",
          params: { completed, mode, muscle: option.id, selected },
        } as never)
      }
      onPressIn={() => {
        scale.value = withSpring(0.975, { damping: 18, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 190 });
      }}
      style={[styles.card, animatedStyle]}
    >
      <View
        style={[
          styles.muscleMark,
          {
            borderColor: muscleColors[option.muscle],
            backgroundColor: `${muscleColors[option.muscle]}22`,
          },
        ]}
      />
      <Text style={styles.cardTitle}>
        {option.id === "custom" ? copy.setup.customTitle : copy.calendar.muscleNames[option.muscle]}
      </Text>
      {option.id === "custom" ? null : (
        <Text style={styles.cardMeta}>
          {`${exerciseCount} ${copy.setup.exerciseCount}`}
        </Text>
      )}
    </AnimatedPressable>
  );
}

function makeStyles(colors: AppPalette) {
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      flexGrow: 1,
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
    body: {
      ...typeRamp.body,
      color: colors.muted,
      marginTop: 30,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 42,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.hairline,
      borderRadius: 22,
      borderWidth: 1,
      minHeight: 138,
      padding: 18,
      width: "48%",
    },
    muscleMark: {
      borderRadius: 24,
      borderWidth: 7,
      height: 48,
      width: 48,
    },
    cardTitle: {
      ...typeRamp.title,
      color: colors.ink,
      marginTop: 18,
    },
    cardMeta: {
      ...typeRamp.micro,
      color: colors.muted,
      marginTop: 4,
    },
    enterQueueButton: {
      alignItems: "center",
      borderRadius: 28,
      height: 58,
      justifyContent: "center",
      marginTop: "auto",
      width: "100%",
    },
    enterQueueText: {
      ...typeRamp.button,
      fontWeight: "700",
      textAlign: "center",
    },
  });
}
