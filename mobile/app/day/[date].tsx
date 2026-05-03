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
import { useLanguage } from "@/i18n/LanguageProvider";
import { AppPalette, useAppTheme } from "@/theme/AppThemeProvider";

const chartBars = [4, 6, 5, 7, 10, 44, 31, 24, 58, 8, 7, 6, 88, 7, 8, 12, 28, 30];

function parseDateParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const date = raw ? new Date(`${raw}T12:00:00`) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatHeaderDate(date: Date, language: "zh" | "en") {
  if (language === "zh") {
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getWeekDates(date: Date) {
  const mondayIndex = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - mondayIndex);

  return Array.from({ length: 7 }, (_, index) => {
    const item = new Date(monday);
    item.setDate(monday.getDate() + index);
    return item;
  });
}

export default function DayOverviewScreen() {
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { copy, language } = useLanguage();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const selectedDate = useMemo(() => parseDateParam(date), [date]);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const scale = useSharedValue(1);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <ScrollView
      contentContainerStyle={[
        styles.screen,
        { paddingBottom: insets.bottom + 38, paddingTop: insets.top + 14 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(320)} style={styles.header}>
        <Pressable
          accessibilityLabel={copy.day.back}
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Text style={styles.iconText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          {formatHeaderDate(selectedDate, language)} {copy.day.today}
        </Text>

        <View style={styles.headerActions}>
          <View style={styles.smallIcon}>
            <Text style={styles.smallIconText}>▦</Text>
          </View>
          <View style={styles.smallIcon}>
            <Text style={styles.smallIconText}>↗</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(40).duration(220)} style={styles.week}>
        {copy.calendar.weekLabels.map((label, index) => {
          const day = weekDates[index];
          const isSelected = day.getDate() === selectedDate.getDate();

          return (
            <View key={`${label}-${day.toISOString()}`} style={styles.weekCell}>
              <Text style={[styles.weekLabel, isSelected && styles.weekSelected]}>
                {label}
              </Text>
              <View style={[styles.weekRing, isSelected && styles.weekRingActive]}>
                <View style={styles.weekHole} />
              </View>
            </View>
          );
        })}
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(80).duration(220)}
        style={styles.heroWrap}
      >
        <Animated.View style={[styles.heroRing, ringStyle]}>
          <View style={styles.heroCap} />
          <Text style={styles.arrow}>→</Text>
          <View style={styles.heroHole} />
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(120).duration(220)}>
        <View style={styles.activityHeader}>
          <View>
            <Text style={styles.sectionLabel}>{copy.day.activity}</Text>
            <Text style={styles.activeMetric}>208/120 {copy.day.kcal}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPressIn={() => {
              scale.value = withSpring(0.96, { damping: 16, stiffness: 220 });
            }}
            onPressOut={() => {
              scale.value = withSpring(1, { damping: 14, stiffness: 180 });
            }}
            style={styles.addButton}
          >
            <Text style={styles.addText}>＋</Text>
          </Pressable>
        </View>

        <View style={styles.chart}>
          {chartBars.map((height, index) => (
            <View key={`${height}-${index}`} style={styles.barSlot}>
              <View style={[styles.bar, { height }]} />
            </View>
          ))}
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>00:00</Text>
          <Text style={styles.timeText}>06:00</Text>
          <Text style={styles.timeText}>12:00</Text>
          <Text style={styles.timeText}>18:00</Text>
        </View>

        <Text style={styles.totalText}>{copy.day.total} 393 {copy.day.kcal}</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(160).duration(220)}>
        <View style={styles.metricsRow}>
          <Metric label={copy.day.steps} value="6,776" />
          <Metric label={copy.day.distance} value="4.61 公里" />
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>{copy.day.floors}</Text>
          <Text style={styles.metricValue}>8</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
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
    justifyContent: "space-between",
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  iconText: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "200",
    lineHeight: 31,
  },
  headerTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 14,
  },
  headerActions: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    flexDirection: "row",
    padding: 4,
  },
  smallIcon: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 34,
  },
  smallIconText: {
    color: colors.ink,
    fontSize: 18,
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  weekCell: {
    alignItems: "center",
    width: 38,
  },
  weekLabel: {
    ...typeRamp.micro,
    color: colors.quiet,
    marginBottom: 7,
  },
  weekSelected: {
    color: colors.active,
  },
  weekRing: {
    alignItems: "center",
    borderColor: colors.activeDeep,
    borderRadius: 16,
    borderWidth: 6,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  weekRingActive: {
    borderColor: colors.active,
  },
  weekHole: {
    backgroundColor: colors.canvas,
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  heroWrap: {
    alignItems: "center",
    marginTop: 30,
  },
  heroRing: {
    alignItems: "center",
    borderColor: colors.active,
    borderRadius: 122,
    borderWidth: 52,
    height: 244,
    justifyContent: "center",
    width: 244,
  },
  heroHole: {
    backgroundColor: colors.canvas,
    borderRadius: 70,
    height: 140,
    position: "absolute",
    width: 140,
  },
  heroCap: {
    backgroundColor: colors.active,
    borderRadius: 34,
    height: 68,
    left: -51,
    position: "absolute",
    top: 68,
    width: 68,
  },
  arrow: {
    color: colors.canvas,
    fontSize: 44,
    fontWeight: "300",
    position: "absolute",
    top: -44,
    zIndex: 2,
  },
  activityHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26,
  },
  sectionLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "500",
  },
  activeMetric: {
    color: colors.active,
    fontSize: 28,
    fontWeight: "300",
    marginTop: 2,
  },
  addButton: {
    alignItems: "center",
    borderColor: colors.active,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  addText: {
    color: colors.active,
    fontSize: 22,
    lineHeight: 26,
  },
  chart: {
    alignItems: "flex-end",
    borderBottomColor: colors.active,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 4,
    height: 96,
    marginTop: 10,
  },
  barSlot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  bar: {
    backgroundColor: colors.active,
    width: 3,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  timeText: {
    ...typeRamp.micro,
    color: colors.quiet,
  },
  totalText: {
    ...typeRamp.micro,
    color: colors.active,
    marginTop: 3,
  },
  metricsRow: {
    borderTopColor: colors.hairline,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 20,
    marginTop: 30,
    paddingTop: 18,
  },
  metric: {
    flex: 1,
  },
  metricBlock: {
    borderTopColor: colors.hairline,
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 16,
  },
  metricLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "500",
  },
  metricValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "200",
    marginTop: 1,
  },
  });
}
