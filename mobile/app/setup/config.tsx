import { useMemo, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import Animated, {
  Extrapolation,
  FadeIn,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { rhythm, typeRamp } from "@/constants/theme";
import { getExerciseById } from "@/data/exerciseSeed";
import { useLanguage } from "@/i18n/LanguageProvider";
import { AppPalette, useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_VISIBLE_ITEMS = 4;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ExerciseConfigScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    completed?: string;
    exercise?: string;
    index?: string;
    muscle?: string;
    selected?: string;
  }>();
  const { copy, language } = useLanguage();
  const { colors, muscleColors } = useAppTheme();
  const { activePlan } = useTraining();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const exercise = useMemo(() => getExerciseById(params.exercise), [params.exercise]);
  const [sets, setSets] = useState(4);
  const [weight, setWeight] = useState(0);
  const selectedIds = useMemo(
    () => activePlan?.selectedIds ?? parseIds(params.selected),
    [activePlan?.selectedIds, params.selected],
  );
  const completedIds = useMemo(
    () => activePlan?.completedIds ?? parseIds(params.completed),
    [activePlan?.completedIds, params.completed],
  );
  const muscleId = activePlan?.muscleId ?? (readParam(params.muscle) ?? "");
  const currentIndex = parseNumber(params.index, 0);
  const scale = useSharedValue(1);
  const title = exercise
    ? language === "zh"
      ? exercise.name.zh
      : exercise.name.en
    : copy.setup.configureTitle;
  const muscleColor = exercise ? muscleColors[exercise.muscleGroup] : colors.active;
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function goBack() {
    router.back();
  }

  return (
    <>
      <Stack.Screen
        options={{
          animationMatchesGesture: true,
          fullScreenGestureEnabled: true,
          gestureEnabled: true,
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
        <Pressable
          accessibilityLabel={copy.setup.back}
          onPress={goBack}
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

      <Animated.Text
        entering={FadeIn.delay(40).duration(220)}
        style={styles.body}
      >
        {copy.setup.configureBody}
      </Animated.Text>

      <Animated.View
        entering={FadeIn.delay(70).duration(220)}
        style={styles.controls}
      >
        <WheelControl
          accentColor={muscleColor}
          label={copy.setup.sets}
          onChange={setSets}
          options={createNumberOptions(1, 12, 1)}
          unit={copy.setup.setLabel}
          value={sets}
        />
        <WheelControl
          accentColor={muscleColor}
          label={copy.setup.weight}
          onChange={setWeight}
          options={createNumberOptions(0, 300, 2.5)}
          unit={copy.setup.kg}
          value={weight}
        />
      </Animated.View>

      <AnimatedPressable
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: "/setup/execute",
            params: {
              completed: completedIds.join(","),
              exercise: readParam(params.exercise) ?? "",
              index: String(currentIndex),
              muscle: muscleId,
              selected: selectedIds.join(","),
              sets: String(sets),
              weight: String(weight),
            },
          } as never)
        }
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 18, stiffness: 260 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 190 });
        }}
        style={[
          styles.startButton,
          { backgroundColor: muscleColor },
          buttonStyle,
        ]}
      >
        <Text style={[styles.startText, { color: "#0B0B0D" }]}>START</Text>
      </AnimatedPressable>
      </ScrollView>
    </>
  );
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

function createNumberOptions(minimum: number, maximum: number, step: number) {
  const total = Math.floor((maximum - minimum) / step);

  return Array.from({ length: total + 1 }, (_, index) =>
    Number((minimum + index * step).toFixed(2)),
  );
}

function WheelControl({
  accentColor,
  label,
  onChange,
  options,
  unit,
  value,
}: {
  accentColor: string;
  label: string;
  onChange: (value: number) => void;
  options: number[];
  unit: string;
  value: number;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollY = useSharedValue(
    Math.max(0, options.findIndex((option) => option === value)) *
      WHEEL_ITEM_HEIGHT,
  );
  const selectedIndex = Math.max(0, options.findIndex((option) => option === value));

  function getNearestIndex(offset: number) {
    return Math.min(
      options.length - 1,
      Math.max(0, Math.round(offset / WHEEL_ITEM_HEIGHT)),
    );
  }

  function updateFromIndex(nextIndex: number) {
    const nextValue = options[nextIndex];

    if (nextValue !== value) {
      onChange(nextValue);
    }
  }

  function updateFromOffset(offset: number) {
    updateFromIndex(getNearestIndex(offset));
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = event.nativeEvent.contentOffset.y;
    scrollY.value = offset;
    updateFromOffset(offset);
  }

  return (
    <View style={styles.wheelControl}>
      <View style={styles.wheelHeader}>
        <Text style={styles.wheelLabel}>{label}</Text>
        <View style={styles.wheelValueBlock}>
          <Text style={styles.wheelValue}>
            {Number.isInteger(value) ? value : value.toFixed(1)}
          </Text>
          <Text style={styles.wheelUnit}>{unit}</Text>
        </View>
      </View>
      <View style={styles.wheelShell}>
        <View
          pointerEvents="none"
          style={[styles.wheelSelection, { borderColor: accentColor }]}
        />
        <Animated.ScrollView
          contentContainerStyle={styles.wheelContent}
          contentOffset={{ x: 0, y: selectedIndex * WHEEL_ITEM_HEIGHT }}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          snapToInterval={WHEEL_ITEM_HEIGHT}
        >
          {options.map((option, index) => (
            <WheelItem
              index={index}
              key={option}
              scrollY={scrollY}
              unit={unit}
              value={option}
            />
          ))}
        </Animated.ScrollView>
      </View>
    </View>
  );
}

function WheelItem({
  index,
  scrollY,
  unit,
  value,
}: {
  index: number;
  scrollY: SharedValue<number>;
  unit: string;
  value: number;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value / WHEEL_ITEM_HEIGHT - index);
    return {
      opacity: interpolate(distance, [0, 1, 2], [1, 0.48, 0.18], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(
            distance,
            [0, 1, 2],
            [1, 0.9, 0.82],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.wheelItem, animatedStyle]}>
      <Text style={styles.wheelItemText}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </Text>
      <Text style={styles.wheelItemUnit}>{unit}</Text>
    </Animated.View>
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
    kicker: {
      ...typeRamp.caption,
      color: colors.muted,
    },
    title: {
      ...typeRamp.display,
      color: colors.ink,
      marginTop: 4,
    },
    body: {
      ...typeRamp.body,
      color: colors.muted,
      marginTop: 22,
    },
    controls: {
      gap: 14,
      marginTop: 24,
    },
    wheelControl: {
      backgroundColor: colors.surface,
      borderColor: colors.hairline,
      borderRadius: 22,
      borderWidth: 1,
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    wheelHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    wheelLabel: {
      ...typeRamp.caption,
      color: colors.muted,
    },
    wheelValueBlock: {
      alignItems: "center",
      flexDirection: "row",
      gap: 7,
    },
    wheelValue: {
      color: colors.ink,
      fontSize: 30,
      fontWeight: "200",
      lineHeight: 34,
    },
    wheelUnit: {
      ...typeRamp.micro,
      color: colors.muted,
    },
    wheelShell: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: 20,
      height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
      marginTop: 12,
      overflow: "hidden",
      position: "relative",
    },
    wheelContent: {
      paddingVertical: WHEEL_ITEM_HEIGHT * 1.5,
    },
    wheelSelection: {
      borderRadius: 16,
      borderWidth: 1,
      height: WHEEL_ITEM_HEIGHT,
      left: 12,
      position: "absolute",
      right: 12,
      top: WHEEL_ITEM_HEIGHT * 1.5,
      zIndex: 2,
    },
    wheelItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      height: WHEEL_ITEM_HEIGHT,
      justifyContent: "center",
    },
    wheelItemText: {
      color: colors.ink,
      fontSize: 29,
      fontWeight: "300",
      lineHeight: 34,
    },
    wheelItemUnit: {
      ...typeRamp.micro,
      color: colors.muted,
    },
    startButton: {
      alignItems: "center",
      alignSelf: "center",
      borderRadius: 28,
      height: 58,
      justifyContent: "center",
      marginTop: "auto",
      width: "100%",
    },
    startText: {
      ...typeRamp.button,
      fontWeight: "700",
      letterSpacing: 0,
      textAlign: "center",
    },
  });
}
