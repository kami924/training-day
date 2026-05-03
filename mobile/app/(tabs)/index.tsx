import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarArchive } from "@/components/CalendarArchive";
import { rhythm, typeRamp } from "@/constants/theme";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";
import {
  ArchiveEntry,
  CompletedExerciseLog,
  LocalWorkoutSession,
  MuscleGroup,
} from "@/types/training";

export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const { copy, language } = useLanguage();
  const { colors } = useAppTheme();
  const {
    activePlan,
    archiveByDate,
    clearActivePlan,
    clearPendingSummary,
    getSessionByDate,
    pendingSummaryDate,
  } = useTraining();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const selectedEntry = selectedDate ? archiveByDate[selectedDate] : undefined;
  const selectedSession = selectedDate ? getSessionByDate(selectedDate) : undefined;
  const hasActivePlan = Boolean(activePlan?.selectedIds.length);

  useEffect(() => {
    if (!pendingSummaryDate) {
      return;
    }

    setSelectedDate(pendingSummaryDate);
    const pendingDate = new Date(`${pendingSummaryDate}T12:00:00`);
    setVisibleMonth(new Date(pendingDate.getFullYear(), pendingDate.getMonth(), 1));
    clearPendingSummary();
  }, [clearPendingSummary, pendingSummaryDate]);

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.canvas }]}
        contentContainerStyle={[
          styles.screen,
          {
            paddingBottom: insets.bottom + 28,
            paddingTop: insets.top + 22,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(420)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              accessibilityLabel={copy.settings.title}
              accessibilityRole="button"
              onPress={() => router.push("/settings" as never)}
              style={[styles.menuButton, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.menuLine, { backgroundColor: colors.ink }]} />
              <View style={[styles.menuLine, { backgroundColor: colors.ink }]} />
              <View style={[styles.menuLine, { backgroundColor: colors.ink }]} />
            </Pressable>
            <View>
              <Text style={[styles.title, { color: colors.ink }]}>
                {copy.archive.title}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(40).duration(220)}>
          <CalendarArchive
            archiveByDate={archiveByDate}
            date={visibleMonth}
            onChangeMonth={setVisibleMonth}
            onSelectDate={setSelectedDate}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(70).duration(220)} style={styles.startSection}>
          <SlideToStartControl
            label={hasActivePlan ? copy.archive.continue : copy.archive.start}
            onComplete={() => {
              if (hasActivePlan) {
                router.push("/setup/queue" as never, { withAnchor: true });
                return;
              }

              clearActivePlan();
              router.push("/setup" as never);
            }}
          />
        </Animated.View>
      </ScrollView>

      <DayRecordModal
        date={selectedDate}
        entry={selectedEntry}
        language={language}
        onClose={() => setSelectedDate(null)}
        session={selectedSession}
      />
    </View>
  );
}

function SlideToStartControl({
  label,
  onComplete,
}: {
  label: string;
  onComplete: () => void;
}) {
  const { copy } = useLanguage();
  const { colors } = useAppTheme();
  const knobX = useSharedValue(0);
  const knobPressed = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const hasTriggered = useSharedValue(false);

  useFocusEffect(
    useCallback(() => {
      cancelAnimation(knobX);
      cancelAnimation(knobPressed);
      hasTriggered.value = false;
      knobPressed.value = 0;
      knobX.value = 0;

      return () => {
        cancelAnimation(knobX);
        cancelAnimation(knobPressed);
        hasTriggered.value = false;
        knobPressed.value = 0;
        knobX.value = 0;
      };
    }, [hasTriggered, knobPressed, knobX]),
  );

  const triggerStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onComplete();
  }, [onComplete]);

  const onTrackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      trackWidth.value = event.nativeEvent.layout.width;
    },
    [trackWidth],
  );

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: knobX.value },
      { scale: 1 + knobPressed.value * 0.035 },
      { scaleY: 1 - knobPressed.value * 0.04 },
    ],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: 56 + knobX.value,
  }));

  const copyStyle = useAnimatedStyle(() => {
    const max = Math.max(trackWidth.value - 72, 1);
    const progress = Math.min(knobX.value / max, 1);

    return {
      opacity: 1 - progress * 0.84,
      transform: [{ translateX: progress * 10 }],
    };
  });

  const gesture = Gesture.Pan()
    .activeOffsetX([12, 999])
    .failOffsetY([-18, 18])
    .onBegin(() => {
      knobPressed.value = withSpring(1, { damping: 22, stiffness: 320, mass: 0.7 });
    })
    .onUpdate((event) => {
      if (hasTriggered.value) {
        return;
      }

      const max = Math.max(trackWidth.value - 72, 0);
      knobX.value = Math.min(Math.max(event.translationX, 0), max);
    })
    .onEnd((event) => {
      const max = Math.max(trackWidth.value - 72, 0);

      if (max === 0) {
        return;
      }

      if (knobX.value >= max * 0.7 || (event.velocityX > 900 && knobX.value >= max * 0.45)) {
        knobX.value = withSpring(max, {
          damping: 22,
          stiffness: 240,
          mass: 0.9,
          velocity: event.velocityX,
        });

        if (!hasTriggered.value) {
          hasTriggered.value = true;
          runOnJS(triggerStart)();
        }

        return;
      }

      knobX.value = withSpring(0, {
        damping: 24,
        stiffness: 250,
        mass: 0.92,
        velocity: event.velocityX,
      });
    })
    .onFinalize(() => {
      knobPressed.value = withSpring(0, { damping: 20, stiffness: 280, mass: 0.75 });
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={onTrackLayout}
        style={[
          styles.startButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.startFill, { backgroundColor: colors.activeDim }, fillStyle]}
        />
        <Animated.View pointerEvents="none" style={[styles.startCopy, copyStyle]}>
          <Text style={[styles.startText, { color: colors.ink }]}>
            {label}
          </Text>
          <Text style={[styles.startHint, { color: colors.quiet }]}>
            {copy.archive.slideHint}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.startAccent, { backgroundColor: colors.active }, knobStyle]}>
          <Text style={[styles.startArrow, { color: colors.canvas }]}>→</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function DayRecordModal({
  date,
  entry,
  language,
  onClose,
  session,
}: {
  date: string | null;
  entry?: ArchiveEntry;
  language: "zh" | "en";
  onClose: () => void;
  session?: LocalWorkoutSession;
}) {
  const insets = useSafeAreaInsets();
  const { copy } = useLanguage();
  const { colorMode, colors } = useAppTheme();

  if (!date) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <View style={styles.recordModalRoot}>
        <Animated.View
          entering={FadeIn.duration(220)}
          style={[
            styles.recordModalShade,
            {
              backgroundColor:
                colorMode === "dark" ? "rgba(0, 0, 0, 0.66)" : "rgba(17, 17, 20, 0.26)",
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.springify().damping(20).stiffness(150)}
          style={[
            styles.recordModalSheet,
            {
              backgroundColor: colors.canvas,
              paddingBottom: insets.bottom + 18,
            },
          ]}
        >
          <View style={[styles.recordHandle, { backgroundColor: colors.hairline }]} />
          <View style={styles.recordModalHeader}>
            <Text style={[styles.recordModalTitle, { color: colors.quiet }]}>
              {copy.logs.detailTitle}
            </Text>
            <Pressable
              accessibilityLabel={copy.archive.close}
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.recordCloseButton, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.recordCloseText, { color: colors.ink }]}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.recordModalContent}
            showsVerticalScrollIndicator={false}
          >
            <SelectedDayPanel
              date={date}
              entry={entry}
              language={language}
              session={session}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SelectedDayPanel({
  date,
  entry,
  language,
  session,
}: {
  date: string;
  entry?: ArchiveEntry;
  language: "zh" | "en";
  session?: LocalWorkoutSession;
}) {
  const { copy } = useLanguage();
  const { colors, muscleColors } = useAppTheme();
  const totalSets = session?.logs.reduce((sum, log) => sum + log.completedSets, 0) ?? 0;
  const totalVolume =
    session?.logs.reduce(
      (sum, log) => sum + log.targetWeight * log.completedSets,
      0,
    ) ?? 0;
  const muscleItems = session
    ? uniqueMuscleItems(session.logs, copy)
    : (entry?.muscles ?? []).map((muscle) => ({
        key: muscle,
        label: copy.calendar.muscleNames[muscle],
        muscle,
      }));

  return (
    <View style={[styles.dayDetailScreen, { backgroundColor: colors.canvas }]}>
      <View style={[styles.dayPanel, { backgroundColor: colors.surface }]}>
      <View style={styles.dayPanelHeader}>
        <View>
          <Text style={[styles.panelKicker, { color: colors.quiet }]}>
            {copy.calendar.selectedDay}
          </Text>
          <Text style={[styles.panelDate, { color: colors.ink }]}>
            {formatDate(date, language)}
          </Text>
        </View>
        <Text style={[styles.panelCount, { color: colors.quiet }]}>
          {session ? `${session.logs.length} ${copy.logs.exercises}` : "—"}
        </Text>
      </View>

      {muscleItems.length ? (
        <Animated.View
          entering={FadeInDown.springify().damping(22).stiffness(170).delay(40)}
          style={styles.panelMuscles}
        >
          {muscleItems.map((item) => (
            <View key={item.key} style={styles.panelMuscleItem}>
              <View
                style={[
                  styles.panelMuscleRing,
                  { borderColor: muscleColors[item.muscle] },
                ]}
              />
              <Text style={[styles.panelMuscleText, { color: colors.quiet }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </Animated.View>
      ) : null}

      {session ? (
        <>
          <View style={styles.panelMetrics}>
            <PanelMetric
              label={copy.logs.totalSets}
              unit={copy.logs.totalSets}
              value={String(totalSets)}
            />
            <PanelMetric
              label={copy.logs.totalVolume}
              unit={copy.setup.kg}
              value={formatNumber(totalVolume)}
            />
          </View>
          <View style={styles.panelLogsGroup}>
            {session.logs.map((log, index) => (
              <View key={log.id}>
                <PanelLogItem index={index} language={language} log={log} />
                {index < session.logs.length - 1 ? (
                  <View style={[styles.panelSeparator, { backgroundColor: colors.hairline }]} />
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={[styles.panelEmpty, { color: colors.quiet }]}>
          {entry ? copy.calendar.noDetail : copy.calendar.noTraining}
        </Text>
      )}
    </View>
    </View>
  );
}

function PanelMetric({
  label,
  unit,
  value,
}: {
  label: string;
  unit: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.panelMetric}>
      <View style={styles.panelMetricValueRow}>
        <Text style={[styles.panelMetricValue, { color: colors.ink }]}>{value}</Text>
        <Text style={[styles.panelMetricUnit, { color: colors.quiet }]}>{unit}</Text>
      </View>
      <Text style={[styles.panelMetricLabel, { color: colors.quiet }]}>{label}</Text>
    </View>
  );
}

function PanelLogItem({
  index,
  language,
  log,
}: {
  index: number;
  language: "zh" | "en";
  log: CompletedExerciseLog;
}) {
  const { copy } = useLanguage();
  const { colors, muscleColors } = useAppTheme();
  const title = language === "zh" ? log.name.zh : log.name.en;

  return (
    <View style={styles.panelLogItem}>
      <View style={styles.panelLogHeader}>
        <View>
          <Text style={[styles.panelLogTitle, { color: colors.ink }]}>{title}</Text>
        </View>
        <View
          style={[
            styles.panelLogRing,
            {
              borderColor: muscleColors[log.muscleGroup],
              shadowColor: muscleColors[log.muscleGroup],
            },
          ]}
        />
      </View>
      <Text style={[styles.panelLogMeta, { color: colors.quiet }]}>
        {log.completedSets}/{log.targetSets} {copy.setup.setLabel} ·{" "}
        {formatNumber(log.targetWeight)} {copy.setup.kg}
      </Text>
    </View>
  );
}

function uniqueMuscles(logs: CompletedExerciseLog[]) {
  return Array.from(new Set(logs.map((log) => log.muscleGroup)));
}

function uniqueMuscleItems(
  logs: CompletedExerciseLog[],
  copy: ReturnType<typeof useLanguage>["copy"],
) {
  const items = new Map<
    string,
    { key: string; label: string; muscle: MuscleGroup }
  >();

  logs.forEach((log) => {
    const label = log.customGroupLabel ?? copy.calendar.muscleNames[log.muscleGroup];
    const key = `${log.muscleGroup}:${label}`;

    if (!items.has(key)) {
      items.set(key, {
        key,
        label,
        muscle: log.muscleGroup,
      });
    }
  });

  return Array.from(items.values());
}

function formatDate(isoDate: string, language: "zh" | "en") {
  const date = new Date(`${isoDate}T12:00:00`);

  if (language === "zh") {
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
  },
  menuButton: {
    alignItems: "center",
    borderRadius: 20,
    gap: 4,
    height: 40,
    justifyContent: "center",
    marginRight: 14,
    width: 40,
  },
  menuLine: {
    borderRadius: 1,
    height: 1,
    width: 16,
  },
  title: {
    ...typeRamp.display,
    fontWeight: "700",
  },
  startSection: {
    marginTop: 28,
  },
  startButton: {
    alignSelf: "center",
    borderRadius: 32,
    borderWidth: 1,
    height: 92,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
    width: "100%",
  },
  startFill: {
    borderRadius: 28,
    bottom: 8,
    left: 8,
    position: "absolute",
    top: 8,
  },
  startCopy: {
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 72,
    paddingRight: 76,
  },
  startAccent: {
    alignItems: "center",
    borderRadius: 27,
    height: 54,
    justifyContent: "center",
    left: 8,
    position: "absolute",
    width: 54,
  },
  startText: {
    ...typeRamp.button,
    fontWeight: "700",
    textAlign: "left",
  },
  startHint: {
    ...typeRamp.micro,
    marginTop: 6,
  },
  startArrow: {
    fontSize: 26,
    fontWeight: "500",
    lineHeight: 28,
  },
  recordModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  recordModalShade: {
    ...StyleSheet.absoluteFillObject,
  },
  recordModalSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "84%",
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  recordHandle: {
    alignSelf: "center",
    borderRadius: 2,
    height: 4,
    marginBottom: 18,
    width: 38,
  },
  recordModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  recordModalTitle: {
    ...typeRamp.caption,
  },
  recordCloseButton: {
    alignItems: "center",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  recordCloseText: {
    fontSize: 24,
    fontWeight: "200",
    lineHeight: 28,
  },
  recordModalContent: {
    paddingBottom: 12,
  },
  dayPanel: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  dayDetailScreen: {
    gap: 16,
    marginTop: 18,
  },
  dayPanelHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelKicker: {
    ...typeRamp.caption,
  },
  panelDate: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
    marginTop: 8,
  },
  panelCount: {
    ...typeRamp.micro,
    marginTop: 6,
  },
  panelMuscles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  panelMuscleItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  panelMuscleRing: {
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  panelMuscleText: {
    ...typeRamp.micro,
  },
  panelMetrics: {
    flexDirection: "row",
    gap: 24,
    marginTop: 26,
  },
  panelMetric: {
    flex: 1,
    minHeight: 78,
    justifyContent: "center",
  },
  panelMetricValueRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 6,
  },
  panelMetricLabel: {
    ...typeRamp.micro,
    marginTop: 8,
  },
  panelMetricValue: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 38,
  },
  panelMetricUnit: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 5,
  },
  panelLogsGroup: {
    borderRadius: 16,
    marginTop: 18,
    overflow: "hidden",
  },
  panelLogItem: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  panelSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  panelLogHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelLogTitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
  },
  panelLogRing: {
    borderRadius: 15,
    borderWidth: 3,
    height: 30,
    opacity: 0.94,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: 30,
  },
  panelLogMeta: {
    ...typeRamp.micro,
    marginTop: 14,
  },
  panelEmpty: {
    ...typeRamp.body,
    marginTop: 22,
  },
});
