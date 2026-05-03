import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { rhythm, typeRamp } from "@/constants/theme";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";
import { ImportedWorkoutRow, MuscleGroup } from "@/types/training";

const muscleOptions: MuscleGroup[] = ["胸", "肩", "背", "臀腿", "手臂", "腹部"];

export default function ImportPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { copy, language } = useLanguage();
  const { colors } = useAppTheme();
  const { applyImportDraft, importDraft, revealArchiveDate, setImportDraft } = useTraining();
  const [isImporting, setIsImporting] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [draftExercise, setDraftExercise] = useState("");
  const [draftSets, setDraftSets] = useState("");
  const [draftWeight, setDraftWeight] = useState("");
  const [draftMuscle, setDraftMuscle] = useState<MuscleGroup>("胸");
  const [editError, setEditError] = useState<string | null>(null);

  const rows = importDraft?.rows ?? [];
  const summaryText = useMemo(() => {
    const exerciseCount = new Set(rows.map((row) => row.exerciseName.trim())).size;

    if (language === "zh") {
      return `共 ${rows.length} 条记录 · ${exerciseCount} 个动作`;
    }

    return `${rows.length} records · ${exerciseCount} exercises`;
  }, [language, rows]);

  const rangeText = useMemo(() => {
    if (!rows.length) {
      return language === "zh" ? "先选择文件或粘贴文本" : "Choose a file or paste text first";
    }

    const dates = rows.map((row) => row.date).sort((left, right) => left.localeCompare(right));
    const first = formatMonthLabel(dates[0]);
    const last = formatMonthLabel(dates[dates.length - 1]);

    return first === last ? first : `${first} - ${last}`;
  }, [language, rows]);

  const editingRow = useMemo(
    () => rows.find((row) => row.id === editingRowId),
    [editingRowId, rows],
  );

  function handleConfirm() {
    if (!rows.length || isImporting) {
      return;
    }

    setIsImporting(true);
    const latestDate = applyImportDraft();

    if (latestDate) {
      revealArchiveDate(latestDate);
    }

    router.dismissTo("/" as never);
  }

  function beginEdit(row: ImportedWorkoutRow) {
    setEditingRowId(row.id);
    setDraftDate(row.date);
    setDraftExercise(row.exerciseName);
    setDraftSets(String(row.completedSets));
    setDraftWeight(row.targetWeight > 0 ? String(row.targetWeight) : "");
    setDraftMuscle(row.muscleGroup);
    setEditError(null);
  }

  function closeEdit() {
    setEditingRowId(null);
    setEditError(null);
  }

  function saveEdit() {
    if (!importDraft || !editingRowId) {
      return;
    }

    const normalizedDate = normalizeDateInput(draftDate);
    const normalizedExercise = draftExercise.trim();
    const normalizedSets = Math.max(1, Number(draftSets));
    const normalizedWeight = Math.max(0, Number(draftWeight || "0"));

    if (!normalizedDate) {
      setEditError(language === "zh" ? "请输入正确日期" : "Enter a valid date");
      return;
    }

    if (!normalizedExercise) {
      setEditError(language === "zh" ? "请输入动作名称" : "Enter an exercise name");
      return;
    }

    if (!Number.isFinite(normalizedSets) || normalizedSets < 1) {
      setEditError(language === "zh" ? "请输入正确组数" : "Enter valid sets");
      return;
    }

    if (!Number.isFinite(normalizedWeight) || normalizedWeight < 0) {
      setEditError(language === "zh" ? "请输入正确重量" : "Enter valid weight");
      return;
    }

    setImportDraft({
      ...importDraft,
      rows: importDraft.rows.map((row) =>
        row.id === editingRowId
          ? {
              ...row,
              completedSets: normalizedSets,
              date: normalizedDate,
              exerciseName: normalizedExercise,
              muscleGroup: draftMuscle,
              targetWeight: normalizedWeight,
            }
          : row,
      ),
    });
    closeEdit();
  }

  return (
    <>
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
            <Text style={[styles.title, { color: colors.ink }]}>{copy.import.previewTitle}</Text>
            <Text style={[styles.body, { color: colors.muted }]}>{copy.import.previewHint}</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricBlock}>
            <Text style={[styles.metricValue, { color: colors.ink }]}>{summaryText}</Text>
            <Text style={[styles.metricLabel, { color: colors.quiet }]}>{rangeText}</Text>
          </View>
        </View>

        <Text style={[styles.editHint, { color: colors.quiet }]}>{copy.import.editableHint}</Text>

        <View style={[styles.previewList, { backgroundColor: colors.surface }]}>
          {rows.length ? (
            rows.map((row, index) => (
              <View key={row.id}>
                <Pressable onPress={() => beginEdit(row)} style={styles.previewRow}>
                  <Text style={[styles.previewText, { color: colors.ink }]}>
                    {formatPreviewRow(row.date, row.exerciseName, row.completedSets, row.targetWeight, language)}
                  </Text>
                  <Text style={[styles.previewChevron, { color: colors.quiet }]}>›</Text>
                </Pressable>
                {index < rows.length - 1 ? (
                  <View style={[styles.previewSeparator, { backgroundColor: colors.hairline }]} />
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.quiet }]}>
                {language === "zh" ? "还没有可预览的训练记录" : "No workout rows ready to preview yet"}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!rows.length || isImporting}
          onPress={handleConfirm}
          style={[
            styles.confirmButton,
            {
              backgroundColor: rows.length ? colors.active : colors.surfaceRaised,
            },
          ]}
        >
          <Text
            style={[
              styles.confirmText,
              { color: rows.length ? colors.canvas : colors.quiet },
            ]}
          >
            {isImporting ? `${copy.import.importConfirm}...` : copy.import.importConfirm}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal animationType="fade" onRequestClose={closeEdit} transparent visible={Boolean(editingRow)}>
        <View style={styles.modalRoot}>
          <Pressable
            onPress={closeEdit}
            style={[styles.modalShade, { backgroundColor: "rgba(0,0,0,0.48)" }]}
          />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>{copy.import.editTitle}</Text>
            <Text style={[styles.modalBody, { color: colors.muted }]}>{copy.import.editBody}</Text>

            <Text style={[styles.fieldLabel, { color: colors.quiet }]}>{copy.import.fieldDate}</Text>
            <TextInput
              onChangeText={setDraftDate}
              placeholder="2026-04-21"
              placeholderTextColor={colors.quiet}
              style={[styles.fieldInput, { borderColor: colors.hairline, color: colors.ink }]}
              value={draftDate}
            />

            <Text style={[styles.fieldLabel, { color: colors.quiet }]}>{copy.import.fieldExercise}</Text>
            <TextInput
              onChangeText={setDraftExercise}
              placeholder={language === "zh" ? "输入动作名称" : "Exercise name"}
              placeholderTextColor={colors.quiet}
              style={[styles.fieldInput, { borderColor: colors.hairline, color: colors.ink }]}
              value={draftExercise}
            />

            <View style={styles.dualRow}>
              <View style={styles.dualField}>
                <Text style={[styles.fieldLabel, { color: colors.quiet }]}>{copy.import.fieldSets}</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setDraftSets}
                  placeholder="4"
                  placeholderTextColor={colors.quiet}
                  style={[styles.fieldInput, { borderColor: colors.hairline, color: colors.ink }]}
                  value={draftSets}
                />
              </View>
              <View style={styles.dualField}>
                <Text style={[styles.fieldLabel, { color: colors.quiet }]}>{copy.import.fieldWeight}</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setDraftWeight}
                  placeholder="60"
                  placeholderTextColor={colors.quiet}
                  style={[styles.fieldInput, { borderColor: colors.hairline, color: colors.ink }]}
                  value={draftWeight}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.quiet }]}>{copy.import.muscleTitle}</Text>
            <View style={styles.muscleRow}>
              {muscleOptions.map((muscle) => (
                <Pressable
                  key={muscle}
                  onPress={() => setDraftMuscle(muscle)}
                  style={[
                    styles.muscleChip,
                    {
                      backgroundColor:
                        draftMuscle === muscle ? colors.activeDim : colors.surfaceRaised,
                      borderColor: draftMuscle === muscle ? colors.active : colors.hairline,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.muscleChipText,
                      { color: draftMuscle === muscle ? colors.active : colors.ink },
                    ]}
                  >
                    {copy.calendar.muscleNames[muscle]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {editError ? (
              <Text style={[styles.errorText, { color: colors.active }]}>{editError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeEdit}
                style={[styles.modalButton, { backgroundColor: colors.surfaceRaised }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.ink }]}>{copy.setup.back}</Text>
              </Pressable>
              <Pressable onPress={saveEdit} style={[styles.modalButton, { backgroundColor: colors.active }]}>
                <Text style={[styles.modalButtonText, { color: colors.canvas }]}>{copy.import.saveEdit}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function formatPreviewRow(
  date: string,
  exerciseName: string,
  sets: number,
  weight: number,
  language: "zh" | "en",
) {
  const dateLabel = date.replace(/-/g, ".");
  const setsLabel = language === "zh" ? `${sets}组` : `${sets} sets`;
  const weightLabel =
    weight > 0
      ? `${weight}${language === "zh" ? "kg" : " kg"}`
      : language === "zh"
        ? "自重"
        : "Bodyweight";

  return `${dateLabel}  ${exerciseName}  ${setsLabel}  ${weightLabel}`;
}

function formatMonthLabel(date: string) {
  return `${date.slice(0, 4)}.${date.slice(5, 7)}`;
}

function normalizeDateInput(value: string) {
  const trimmed = value.trim().replace(/[./]/g, "-");
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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
  metricRow: {
    marginTop: 32,
  },
  metricBlock: {
    justifyContent: "center",
    minHeight: 74,
  },
  metricValue: {
    ...typeRamp.title,
    fontWeight: "600",
  },
  metricLabel: {
    ...typeRamp.micro,
    marginTop: 8,
  },
  editHint: {
    ...typeRamp.micro,
    marginTop: 10,
  },
  previewList: {
    borderRadius: 24,
    marginTop: 20,
    overflow: "hidden",
  },
  previewRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: 18,
  },
  previewText: {
    ...typeRamp.body,
    flex: 1,
    paddingRight: 12,
  },
  previewChevron: {
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 24,
  },
  previewSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 18,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    paddingHorizontal: 18,
  },
  emptyText: {
    ...typeRamp.micro,
    textAlign: "center",
  },
  confirmButton: {
    alignItems: "center",
    borderRadius: 24,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 56,
  },
  confirmText: {
    ...typeRamp.button,
    fontWeight: "700",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: rhythm.page,
  },
  modalShade: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  modalTitle: {
    ...typeRamp.title,
    fontWeight: "700",
  },
  modalBody: {
    ...typeRamp.micro,
    marginTop: 8,
  },
  fieldLabel: {
    ...typeRamp.micro,
    marginTop: 16,
  },
  fieldInput: {
    ...typeRamp.body,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  dualRow: {
    flexDirection: "row",
    gap: 12,
  },
  dualField: {
    flex: 1,
  },
  muscleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  muscleChip: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  muscleChipText: {
    ...typeRamp.micro,
    fontWeight: "600",
  },
  errorText: {
    ...typeRamp.micro,
    marginTop: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  modalButton: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  modalButtonText: {
    ...typeRamp.button,
    fontWeight: "700",
  },
});
