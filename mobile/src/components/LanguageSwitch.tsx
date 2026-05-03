import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { typeRamp } from "@/constants/theme";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Language } from "@/i18n/translations";
import { useAppTheme } from "@/theme/AppThemeProvider";

const TRACK_WIDTH = 168;
const TRACK_PADDING = 4;
const OPTION_WIDTH = (TRACK_WIDTH - TRACK_PADDING * 2) / 2;

export function LanguageSwitch() {
  const { copy, language, setLanguage } = useLanguage();
  const { colors } = useAppTheme();
  const progress = useSharedValue(language === "zh" ? 0 : 1);

  useEffect(() => {
    progress.value = withSpring(language === "zh" ? 0 : 1, {
      damping: 18,
      stiffness: 190,
    });
  }, [language, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * OPTION_WIDTH }],
  }));

  const options: Array<{ label: string; value: Language }> = [
    { label: copy.settings.chinese, value: "zh" },
    { label: copy.settings.english, value: "en" },
  ];

  return (
    <View style={[styles.track, { backgroundColor: colors.surface }]}>
      <Animated.View
        style={[styles.knob, { backgroundColor: colors.active }, knobStyle]}
      />
      {options.map((option) => {
        const active = option.value === language;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => setLanguage(option.value)}
            style={styles.option}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.canvas : colors.muted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 8,
    flexDirection: "row",
    height: 44,
    padding: TRACK_PADDING,
    position: "relative",
    width: TRACK_WIDTH,
  },
  knob: {
    borderRadius: 6,
    height: 36,
    left: TRACK_PADDING,
    position: "absolute",
    top: TRACK_PADDING,
    width: OPTION_WIDTH,
  },
  option: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: OPTION_WIDTH,
  },
  label: {
    ...typeRamp.micro,
  },
});
