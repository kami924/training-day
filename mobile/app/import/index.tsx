import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { rhythm, typeRamp } from "@/constants/theme";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAppTheme } from "@/theme/AppThemeProvider";

export default function ImportIndexScreen() {
  const insets = useSafeAreaInsets();
  const { copy } = useLanguage();
  const { colors } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.screen,
        {
          backgroundColor: colors.canvas,
          paddingBottom: insets.bottom + 40,
          paddingTop: insets.top + 18,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={copy.setup.back}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.backText, { color: colors.ink }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.ink }]}>{copy.import.title}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{copy.import.body}</Text>
        </View>
      </View>

      <View style={styles.cardList}>
        <ImportCard
          body={copy.import.fileHint}
          colors={colors}
          label={copy.import.open}
          onPress={() => router.push("/import/file" as never)}
          title={copy.import.fileTitle}
        />
        <ImportCard
          body={copy.import.screenshotHint}
          colors={colors}
          label={copy.import.open}
          onPress={() => router.push("/import/screenshot" as never)}
          title={copy.import.screenshotTitle}
        />
      </View>

      <View
        style={[
          styles.noteBlock,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <Text style={[styles.noteTitle, { color: colors.ink }]}>{copy.import.fromOtherApps}</Text>
        <Text style={[styles.noteBody, { color: colors.muted }]}>{copy.import.fromOtherAppsHint}</Text>
        <Text style={[styles.noteMeta, { color: colors.quiet }]}>{copy.import.prototypeNote}</Text>
      </View>
    </ScrollView>
  );
}

function ImportCard({
  body,
  colors,
  label,
  onPress,
  title,
}: {
  body: string;
  colors: ReturnType<typeof useAppTheme>["colors"];
  label: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.hairline,
        },
      ]}
    >
      <View style={styles.cardCopy}>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.cardBody, { color: colors.muted }]}>{body}</Text>
      </View>
      <View style={styles.cardMeta}>
        <Text style={[styles.cardLabel, { color: colors.quiet }]}>{label}</Text>
        <Text style={[styles.cardChevron, { color: colors.quiet }]}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    paddingHorizontal: rhythm.page,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
  },
  backButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginRight: 16,
    width: 40,
  },
  backText: {
    fontSize: 30,
    fontWeight: "200",
    lineHeight: 32,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    ...typeRamp.display,
    fontWeight: "700",
  },
  body: {
    ...typeRamp.body,
    marginTop: 10,
  },
  cardList: {
    gap: 14,
    marginTop: 34,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 118,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardCopy: {
    flex: 1,
    justifyContent: "space-between",
    paddingRight: 16,
  },
  cardTitle: {
    ...typeRamp.title,
  },
  cardBody: {
    ...typeRamp.body,
    marginTop: 8,
  },
  cardMeta: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  cardLabel: {
    ...typeRamp.caption,
    textTransform: "uppercase",
  },
  cardChevron: {
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 28,
  },
  noteBlock: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 30,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  noteTitle: {
    ...typeRamp.body,
    fontWeight: "600",
  },
  noteBody: {
    ...typeRamp.body,
    marginTop: 10,
  },
  noteMeta: {
    ...typeRamp.micro,
    marginTop: 16,
  },
});
