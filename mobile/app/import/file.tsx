import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as XLSX from "xlsx";

import { rhythm, typeRamp } from "@/constants/theme";
import { parseWorkoutImportText } from "@/import/workoutImport";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";

export default function ImportFileScreen() {
  const insets = useSafeAreaInsets();
  const { copy } = useLanguage();
  const { colors } = useAppTheme();
  const { importDraft, setImportDraft } = useTraining();
  const [pastedText, setPastedText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [isParsingText, setIsParsingText] = useState(false);

  async function handleChooseFile() {
    try {
      setErrorMessage(null);
      setIsPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: [
          "text/csv",
          "text/plain",
          "text/tab-separated-values",
          "application/csv",
          "public.comma-separated-values-text",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const isExcelFile = /\.xlsx?$/i.test(asset.name) || /sheet|excel/i.test(asset.mimeType ?? "");
      const content = isExcelFile
        ? await readWorkbookAsText(asset.uri)
        : await FileSystem.readAsStringAsync(asset.uri);
      const draft = parseWorkoutImportText(content, "file", asset.name);
      setImportDraft(draft);
      router.push("/import/preview" as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : "文件读取失败";
      setErrorMessage(message);
    } finally {
      setIsPickingFile(false);
    }
  }

  function handlePreview() {
    try {
      setErrorMessage(null);
      const normalizedText = pastedText.trim();

      if (!normalizedText.length) {
        if (importDraft?.rows.length) {
          router.push("/import/preview" as never);
          return;
        }

        setErrorMessage("请选择文件或粘贴训练记录");
        return;
      }

      setIsParsingText(true);
      const draft = parseWorkoutImportText(normalizedText, "text");
      setImportDraft(draft);
      router.push("/import/preview" as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : "文本解析失败";
      setErrorMessage(message);
    } finally {
      setIsParsingText(false);
    }
  }

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
          <Text style={[styles.title, { color: colors.ink }]}>{copy.import.fileScreenTitle}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{copy.import.fileScreenBody}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={handleChooseFile}
          style={[styles.primaryAction, { backgroundColor: colors.active }]}
        >
          <Text style={[styles.primaryActionText, { color: colors.canvas }]}>
            {isPickingFile ? `${copy.import.chooseFile}...` : copy.import.chooseFile}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.supported, { color: colors.quiet }]}>{copy.import.supportedFormats}</Text>
      <Text style={[styles.textLabel, { color: colors.ink }]}>{copy.import.pasteText}</Text>

      <View
        style={[
          styles.textInputWrap,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <TextInput
          multiline
          onChangeText={setPastedText}
          placeholder={`2026-04-21,卧推,4,60\n2026-04-21,划船,4,50`}
          placeholderTextColor={colors.quiet}
          style={[styles.textInput, { color: colors.ink }]}
          value={pastedText}
        />
      </View>

      {errorMessage ? (
        <Text style={[styles.errorText, { color: colors.active }]}>{errorMessage}</Text>
      ) : null}

      <View
        style={[
          styles.exampleBlock,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>
          {copy.import.supportedFormats}
        </Text>
        <Text style={[styles.sectionBody, { color: colors.muted }]}>
          2026-04-21,卧推,4,60{"\n"}2026-04-21 卧推 4组 60kg
        </Text>
        {importDraft?.fileName ? (
          <Text style={[styles.currentFile, { color: colors.quiet }]}>{importDraft.fileName}</Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isPickingFile || isParsingText || (!importDraft?.rows.length && !pastedText.trim().length)}
        onPress={handlePreview}
        style={[styles.previewButton, { backgroundColor: colors.active }]}
      >
        <Text style={[styles.previewButtonText, { color: colors.canvas }]}>
          {isParsingText ? `${copy.import.previewTitle}...` : copy.import.previewTitle}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

async function readWorkbookAsText(uri: string) {
  const workbookBase64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const workbook = XLSX.read(workbookBase64, { type: "base64" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("没有识别到可读取的工作表");
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_csv(firstSheet, { blankrows: false });
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
  actionRow: {
    gap: 12,
    marginTop: 30,
  },
  primaryAction: {
    alignItems: "center",
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 20,
  },
  primaryActionText: {
    ...typeRamp.button,
    fontWeight: "700",
  },
  supported: {
    ...typeRamp.micro,
    marginTop: 12,
    textAlign: "center",
  },
  textLabel: {
    ...typeRamp.caption,
    fontWeight: "600",
    marginTop: 18,
  },
  textInputWrap: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
    minHeight: 148,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    ...typeRamp.body,
    minHeight: 120,
    textAlignVertical: "top",
  },
  errorText: {
    ...typeRamp.micro,
    marginTop: 10,
  },
  exampleBlock: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sectionTitle: {
    ...typeRamp.title,
  },
  sectionBody: {
    ...typeRamp.body,
    marginTop: 8,
  },
  currentFile: {
    ...typeRamp.micro,
    marginTop: 12,
  },
  previewButton: {
    alignItems: "center",
    borderRadius: 24,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 56,
  },
  previewButtonText: {
    ...typeRamp.button,
    fontWeight: "700",
  },
});
