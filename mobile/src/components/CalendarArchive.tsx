import { memo, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  LinearTransition,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import {
  MuscleSegmentRing,
} from "@/components/MuscleSegmentRing";
import { typeRamp } from "@/constants/theme";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ArchiveEntry, ArchiveMap } from "@/types/training";
import { useAppTheme } from "@/theme/AppThemeProvider";

type CalendarArchiveProps = {
  archiveByDate: ArchiveMap;
  date: Date;
  onChangeMonth?: (date: Date) => void;
  onSelectDate?: (isoDate: string) => void;
};

type CalendarCell = {
  day: number | null;
  key: string;
  isoDate: string;
};

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function getMonthCells(date: Date): CalendarCell[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const mondayIndex = (firstDay.getDay() + 6) % 7;
  const cells: CalendarCell[] = [];

  for (let index = 0; index < mondayIndex; index += 1) {
    cells.push({ day: null, isoDate: "", key: `empty-start-${index}` });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const isoDate = toIsoDate(year, month, day);
    cells.push({ day, isoDate, key: isoDate });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, isoDate: "", key: `empty-end-${cells.length}` });
  }

  return cells;
}

function getMonthTitle(date: Date, language: "zh" | "en") {
  if (language === "zh") {
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
  }

  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isBeforeMonth(left: Date, right: Date) {
  if (left.getFullYear() !== right.getFullYear()) {
    return left.getFullYear() < right.getFullYear();
  }

  return left.getMonth() < right.getMonth();
}

function isAfterMonth(left: Date, right: Date) {
  if (left.getFullYear() !== right.getFullYear()) {
    return left.getFullYear() > right.getFullYear();
  }

  return left.getMonth() > right.getMonth();
}

function getRingProgress(entry?: ArchiveEntry, isToday?: boolean) {
  if (entry?.status === "done") {
    return Math.min(0.32 + (entry.muscles.length - 1) * 0.2, 0.84);
  }

  if (isToday) {
    return 0.14;
  }

  return 0;
}

function getMuscleSummary(
  entry: ArchiveEntry,
  abbreviations: Record<string, string>,
  language: "zh" | "en",
) {
  const labels = (entry.muscleLabels?.length ? entry.muscleLabels : entry.muscles).map(
    (label, index) => {
      const muscle = entry.muscles[index];

      if (entry.muscleLabels?.length) {
        return abbreviateCustomLabel(label, language);
      }

      return abbreviations[muscle] ?? label;
    },
  );

  if (labels.length <= 2) {
    return language === "zh" ? labels.join("") : labels.join("/");
  }

  const prefix =
    language === "zh" ? labels.slice(0, 2).join("") : labels.slice(0, 2).join("/");
  return `${prefix}+${labels.length - 2}`;
}

function abbreviateCustomLabel(label: string, language: "zh" | "en") {
  const trimmed = label.trim();

  if (!trimmed) {
    return "";
  }

  if (language === "zh") {
    return trimmed.slice(0, 2);
  }

  return trimmed
    .split(/\s+/)
    .map((part) => part.slice(0, 1))
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export const CalendarArchive = memo(function CalendarArchive({
  archiveByDate,
  date,
  onChangeMonth,
  onSelectDate,
}: CalendarArchiveProps) {
  const { copy, language } = useLanguage();
  const { colors, muscleColors, setShowHomeMuscles, showHomeMuscles } = useAppTheme();
  const muscleProgress = useSharedValue(1);
  const cells = useMemo(() => getMonthCells(date), [date]);
  const currentMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
  const earliestMonth = useMemo(() => new Date(2024, 0, 1), []);
  const todayIso = useMemo(() => {
    const now = new Date();
    return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  useEffect(() => {
    muscleProgress.value = withSpring(showHomeMuscles ? 1 : 0, {
      damping: 22,
      stiffness: 180,
    });
  }, [muscleProgress, showHomeMuscles]);

  const muscleLayerStyle = useAnimatedStyle(() => ({
    opacity: muscleProgress.value,
    transform: [{ translateY: (1 - muscleProgress.value) * 3 }],
  }));

  const primaryLayerStyle = useAnimatedStyle(() => ({
    opacity: 1 - muscleProgress.value,
    transform: [{ scale: 1 - muscleProgress.value * 0.035 }],
  }));

  const goPrevMonth = () => {
    const prevMonth = shiftMonth(date, -1);

    if (!isBeforeMonth(prevMonth, earliestMonth)) {
      onChangeMonth?.(prevMonth);
    }
  };

  const goNextMonth = () => {
    const nextMonth = shiftMonth(date, 1);

    if (!isAfterMonth(nextMonth, currentMonth)) {
      onChangeMonth?.(nextMonth);
    }
  };

  const canGoPrev = !isBeforeMonth(shiftMonth(date, -1), earliestMonth);
  const canGoNext = !isAfterMonth(shiftMonth(date, 1), currentMonth);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-16, 16])
    .onEnd((event) => {
      const shouldGoPrev = event.translationX > 52 || event.velocityX > 700;
      const shouldGoNext = event.translationX < -52 || event.velocityX < -700;

      if (shouldGoPrev) {
        runOnJS(goPrevMonth)();
      } else if (shouldGoNext) {
        runOnJS(goNextMonth)();
      }
    });

  return (
    <Animated.View
      layout={LinearTransition.springify()}
      style={[styles.wrap, { backgroundColor: colors.surface }]}
    >
      <View style={styles.topRow}>
        <View style={styles.monthHeader}>
          <Pressable
            accessibilityLabel={language === "zh" ? "上个月" : "Previous month"}
            accessibilityRole="button"
            disabled={!canGoPrev}
            onPress={goPrevMonth}
            style={[
              styles.monthArrow,
              { backgroundColor: colors.surfaceRaised, borderColor: colors.hairline },
              !canGoPrev && { opacity: 0.32 },
            ]}
          >
            <Text style={[styles.monthArrowText, { color: colors.ink }]}>‹</Text>
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.ink }]}>
            {getMonthTitle(date, language)}
          </Text>
          <Pressable
            accessibilityLabel={language === "zh" ? "下个月" : "Next month"}
            accessibilityRole="button"
            disabled={!canGoNext}
            onPress={goNextMonth}
            style={[
              styles.monthArrow,
              { backgroundColor: colors.surfaceRaised, borderColor: colors.hairline },
              !canGoNext && { opacity: 0.32 },
            ]}
          >
            <Text style={[styles.monthArrowText, { color: colors.ink }]}>›</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel={copy.calendar.showMuscles}
          accessibilityRole="button"
          onPress={() => setShowHomeMuscles(!showHomeMuscles)}
          style={[
            styles.toggle,
            {
              backgroundColor: showHomeMuscles ? colors.surfaceRaised : "transparent",
              borderColor: colors.hairline,
            },
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              { color: showHomeMuscles ? colors.ink : colors.muted },
            ]}
          >
            {copy.calendar.showMuscles}
          </Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {copy.calendar.weekLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.weekLabel, { color: colors.muted }]}>
            {label}
          </Text>
        ))}
      </View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          entering={FadeIn.duration(180)}
          key={`${date.getFullYear()}-${date.getMonth()}`}
          style={styles.grid}
        >
          {cells.map((cell) => {
            const entry = cell.isoDate ? archiveByDate[cell.isoDate] : undefined;
            const isToday = cell.isoDate === todayIso;
            const progress = getRingProgress(entry, isToday);

            return (
              <View key={cell.key} style={styles.cell}>
                {cell.day ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onSelectDate?.(cell.isoDate)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      pressed && styles.dayPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.day,
                        { color: colors.muted },
                        entry && { color: colors.ink },
                        isToday && { color: colors.active },
                      ]}
                    >
                      {cell.day}
                    </Text>
                    {entry ? (
                      <View style={styles.ringWrap}>
                        <Animated.View
                          pointerEvents="none"
                          style={[styles.ringLayer, muscleLayerStyle]}
                        >
                          <MuscleSegmentRing
                            muscleColors={muscleColors}
                            muscles={entry.muscles}
                            size={isToday ? 46 : 42}
                            strokeWidth={7}
                            trackColor={colors.ringTrack}
                          />
                        </Animated.View>
                        <Animated.View
                          pointerEvents="none"
                          style={[styles.ringLayer, primaryLayerStyle]}
                        >
                          <View
                            style={[
                              styles.singleRing,
                              {
                                borderColor: colors.active,
                                opacity: progress,
                              },
                              isToday && styles.singleRingToday,
                            ]}
                          />
                        </Animated.View>
                        <Animated.Text
                          numberOfLines={1}
                          style={[
                            styles.muscleLabel,
                            { color: isToday ? colors.active : colors.muted },
                            muscleLayerStyle,
                          ]}
                        >
                          {getMuscleSummary(
                            entry,
                            copy.calendar.muscleAbbreviations,
                            language,
                          )}
                        </Animated.Text>
                      </View>
                    ) : null}
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 30,
    paddingBottom: 30,
    paddingHorizontal: 12,
    paddingTop: 20,
    width: "100%",
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  monthArrow: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  monthArrowText: {
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 24,
    marginTop: -1,
  },
  toggle: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  toggleText: {
    ...typeRamp.micro,
    fontWeight: "600",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  weekLabel: {
    ...typeRamp.micro,
    flex: 1,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    alignItems: "center",
    height: 88,
    width: `${100 / 7}%`,
  },
  dayButton: {
    alignItems: "center",
    height: 84,
    justifyContent: "flex-start",
    position: "relative",
    width: 52,
  },
  dayPressed: {
    opacity: 0.6,
  },
  day: {
    fontSize: 13,
    fontWeight: "700",
    height: 18,
    lineHeight: 20,
    textAlign: "center",
    zIndex: 2,
  },
  ringWrap: {
    alignItems: "center",
    height: 64,
    marginTop: 5,
    position: "relative",
    width: 52,
  },
  ringLayer: {
    alignItems: "center",
    height: 46,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: 0,
    width: 52,
  },
  singleRing: {
    borderRadius: 20,
    borderWidth: 7,
    height: 40,
    width: 40,
  },
  singleRingToday: {
    borderRadius: 23,
    height: 46,
    width: 46,
  },
  muscleLabel: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
    marginTop: 3,
    maxWidth: 52,
    position: "absolute",
    textAlign: "center",
    top: 48,
    zIndex: 2,
  },
});
