import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ThemeSwatches } from "@/components/ThemeSwatches";
import { rhythm, typeRamp } from "@/constants/theme";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAppTheme } from "@/theme/AppThemeProvider";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { copy } = useLanguage();
  const { colors } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.screen,
        {
          backgroundColor: colors.canvas,
          paddingBottom: insets.bottom + 54,
          paddingTop: insets.top + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel={copy.setup.back}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.backGlyph, { color: colors.ink }]}>‹</Text>
        </Pressable>
      </View>

      <Text style={[styles.title, { color: colors.ink }]}>
        {copy.settings.title}
      </Text>
      <Text style={[styles.body, { color: colors.muted }]}>{copy.settings.body}</Text>

      <View style={styles.languageRow}>
        <View style={styles.languageCopy}>
          <Text style={[styles.languageTitle, { color: colors.ink }]}>
            {copy.settings.languageTitle}
          </Text>
          <Text style={[styles.languageHint, { color: colors.muted }]}>
            {copy.settings.languageHint}
          </Text>
        </View>
        <LanguageSwitch />
      </View>

      <View style={styles.themeSection}>
        <Text style={[styles.languageTitle, { color: colors.ink }]}>
          {copy.settings.themeTitle}
        </Text>
        <Text style={[styles.languageHint, { color: colors.muted }]}>
          {copy.settings.themeHint}
        </Text>
        <ThemeSwatches />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    paddingHorizontal: rhythm.page,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    height: 40,
    marginBottom: 22,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  backGlyph: {
    fontSize: 34,
    fontWeight: "200",
    lineHeight: 36,
    marginTop: -2,
  },
  title: {
    ...typeRamp.display,
    fontWeight: "700",
  },
  body: {
    ...typeRamp.body,
    marginTop: 28,
  },
  languageRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 54,
  },
  languageCopy: {
    flex: 1,
    paddingRight: 20,
  },
  languageTitle: {
    ...typeRamp.title,
  },
  languageHint: {
    ...typeRamp.micro,
    marginTop: 8,
  },
  themeSection: {
    marginTop: 44,
  },
});
