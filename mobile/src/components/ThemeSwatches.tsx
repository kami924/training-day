import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { typeRamp } from "@/constants/theme";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ColorMode, useAppTheme } from "@/theme/AppThemeProvider";
import { MuscleGroup } from "@/types/training";

const modes: Array<{ id: ColorMode; sample: string }> = [
  { id: "dark", sample: "#000000" },
  { id: "light", sample: "#F6F4EF" },
];

const colorWheel = [
  "#FF3B30",
  "#FF5C62",
  "#FF8A2A",
  "#FFB629",
  "#E7FF35",
  "#B8FF2C",
  "#53F56F",
  "#35E6C5",
  "#69E7FF",
  "#39A8FF",
  "#4F7CFF",
  "#9B7CFF",
  "#D96BFF",
  "#F6F6F7",
];

const muscles: MuscleGroup[] = ["胸", "肩", "背", "臀腿", "手臂", "腹部"];
const WHEEL_SIZE = 176;
const DOT_SIZE = 28;
const RADIUS = 70;

export function ThemeSwatches() {
  const insets = useSafeAreaInsets();
  const {
    accentColor,
    colorMode,
    colors,
    muscleColors,
    setAccentColor,
    setColorMode,
    setMuscleColor,
  } = useAppTheme();
  const { copy } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>("胸");
  const [personalizationOpen, setPersonalizationOpen] = useState(false);

  const labels: Record<ColorMode, string> = {
    dark: copy.settings.darkMode,
    light: copy.settings.lightMode,
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.modeRow}>
        {modes.map((mode) => {
          const active = colorMode === mode.id;

          return (
            <Pressable
              accessibilityRole="button"
              key={mode.id}
              onPress={() => setColorMode(mode.id)}
              style={[
                styles.modeButton,
                {
                  backgroundColor: active ? colors.surfaceRaised : "transparent",
                  borderColor: active ? colors.active : colors.hairline,
                },
              ]}
            >
              <View
                style={[
                  styles.sample,
                  {
                    backgroundColor: mode.sample,
                    borderColor: mode.id === "light" ? colors.hairline : "transparent",
                  },
                ]}
              />
              <Text style={[styles.label, { color: active ? colors.ink : colors.muted }]}>
                {labels[mode.id]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setPersonalizationOpen(true)}
        style={[
          styles.personalizationEntry,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <View style={styles.personalizationCopy}>
          <Text style={[styles.entryTitle, { color: colors.ink }]}>
            {copy.settings.personalizationTitle}
          </Text>
          <Text style={[styles.entryHint, { color: colors.muted }]}>
            {copy.settings.personalizationHint}
          </Text>
        </View>
        <View style={styles.previewCluster}>
          <View style={[styles.accentPreview, { backgroundColor: accentColor }]} />
          <View style={styles.previewMuscles}>
            {muscles.slice(0, 4).map((muscle) => (
              <View
                key={muscle}
                style={[
                  styles.previewDot,
                  { backgroundColor: muscleColors[muscle] },
                ]}
              />
            ))}
          </View>
        </View>
        <Text style={[styles.chevron, { color: colors.quiet }]}>›</Text>
      </Pressable>

      <Modal
        animationType="none"
        onRequestClose={() => setPersonalizationOpen(false)}
        transparent
        visible={personalizationOpen}
      >
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(120)}
          style={[styles.modalBackdrop, { backgroundColor: colors.canvas }]}
        >
          <Animated.View
            entering={SlideInRight.springify().damping(24).stiffness(190)}
            style={[
              styles.modalScreen,
              {
                paddingBottom: insets.bottom + 32,
                paddingTop: insets.top + 22,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPersonalizationOpen(false)}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.hairline,
                  },
                ]}
              >
                <Text style={[styles.backText, { color: colors.ink }]}>‹</Text>
              </Pressable>
              <Text style={[styles.modalHeaderTitle, { color: colors.ink }]}>
                {copy.settings.personalizationTitle}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Section
                body={copy.settings.accentHint}
                colors={colors}
                title={copy.settings.accentTitle}
              >
                <ColorWheel
                  activeColor={accentColor}
                  colors={colors}
                  label={copy.settings.accentTitle}
                  onSelect={setAccentColor}
                  options={colorWheel}
                />
              </Section>

              <Section
                body={copy.settings.muscleColorHint}
                colors={colors}
                title={copy.settings.muscleColorTitle}
              >
                <View style={styles.muscleRow}>
                  {muscles.map((muscle) => {
                    const active = selectedMuscle === muscle;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={muscle}
                        onPress={() => setSelectedMuscle(muscle)}
                        style={[
                          styles.muscleButton,
                          {
                            borderColor: active
                              ? muscleColors[muscle]
                              : colors.hairline,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.muscleDot,
                            { backgroundColor: muscleColors[muscle] },
                          ]}
                        />
                        <Text
                          style={[
                            styles.muscleText,
                            { color: active ? colors.ink : colors.muted },
                          ]}
                        >
                          {copy.calendar.muscleAbbreviations[muscle]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <ColorWheel
                  activeColor={muscleColors[selectedMuscle]}
                  colors={colors}
                  label={copy.calendar.muscleAbbreviations[selectedMuscle]}
                  onSelect={(color) => setMuscleColor(selectedMuscle, color)}
                  options={colorWheel}
                />
              </Section>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

type SectionProps = {
  body: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useAppTheme>["colors"];
  title: string;
};

function Section({ body, children, colors, title }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: colors.muted }]}>{body}</Text>
      {children}
    </View>
  );
}

type ColorWheelProps = {
  activeColor: string;
  colors: ReturnType<typeof useAppTheme>["colors"];
  label: string;
  onSelect: (color: string) => void;
  options: string[];
};

function ColorWheel({
  activeColor,
  colors,
  label,
  onSelect,
  options,
}: ColorWheelProps) {
  return (
    <View style={styles.wheelWrap}>
      <View
        style={[
          styles.wheelCenter,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <View style={[styles.currentColor, { backgroundColor: activeColor }]} />
        <Text style={[styles.centerText, { color: colors.muted }]}>{label}</Text>
      </View>
      {options.map((color, index) => {
        const angle = (index / options.length) * Math.PI * 2 - Math.PI / 2;
        const left = WHEEL_SIZE / 2 + Math.cos(angle) * RADIUS - DOT_SIZE / 2;
        const top = WHEEL_SIZE / 2 + Math.sin(angle) * RADIUS - DOT_SIZE / 2;
        const active = color.toLowerCase() === activeColor.toLowerCase();

        return (
          <Pressable
            accessibilityRole="button"
            key={color}
            onPress={() => onSelect(color)}
            style={[
              styles.colorDot,
              {
                backgroundColor: color,
                borderColor: active ? colors.ink : colors.canvas,
                left,
                top,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
    marginTop: 18,
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  sample: {
    borderRadius: 11,
    borderWidth: 1,
    height: 22,
    width: 22,
  },
  label: {
    ...typeRamp.body,
    fontWeight: "500",
  },
  personalizationEntry: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 84,
    paddingHorizontal: 18,
  },
  personalizationCopy: {
    flex: 1,
    paddingRight: 16,
  },
  entryTitle: {
    ...typeRamp.body,
    fontWeight: "600",
  },
  entryHint: {
    ...typeRamp.micro,
    marginTop: 6,
  },
  previewCluster: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  accentPreview: {
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  previewMuscles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    width: 19,
  },
  previewDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  chevron: {
    ...typeRamp.title,
    marginLeft: 14,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalScreen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  backText: {
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  modalHeaderTitle: {
    ...typeRamp.title,
  },
  headerSpacer: {
    width: 40,
  },
  modalContent: {
    gap: 34,
    paddingTop: 38,
  },
  section: {
    alignItems: "center",
    gap: 14,
  },
  sectionTitle: {
    ...typeRamp.title,
    alignSelf: "flex-start",
  },
  sectionBody: {
    ...typeRamp.micro,
    alignSelf: "flex-start",
  },
  wheelWrap: {
    height: WHEEL_SIZE,
    position: "relative",
    width: WHEEL_SIZE,
  },
  wheelCenter: {
    alignItems: "center",
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    left: (WHEEL_SIZE - 88) / 2,
    position: "absolute",
    top: (WHEEL_SIZE - 88) / 2,
    width: 88,
  },
  currentColor: {
    borderRadius: 16,
    height: 32,
    width: 32,
  },
  centerText: {
    ...typeRamp.micro,
    marginTop: 8,
  },
  colorDot: {
    borderRadius: DOT_SIZE / 2,
    borderWidth: 3,
    height: DOT_SIZE,
    position: "absolute",
    width: DOT_SIZE,
  },
  muscleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  muscleButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  muscleDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  muscleText: {
    ...typeRamp.micro,
    fontWeight: "700",
  },
});
