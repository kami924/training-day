import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { rhythm, typeRamp } from "@/constants/theme";
import { curateWorkoutImportText, parseWorkoutImportText } from "@/import/workoutImport";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAppTheme } from "@/theme/AppThemeProvider";
import { useTraining } from "@/training/TrainingProvider";

export default function ImportScreenshotScreen() {
  const insets = useSafeAreaInsets();
  const { copy } = useLanguage();
  const { colors } = useAppTheme();
  const { setImportDraft } = useTraining();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);

  const webViewHtml = useMemo(
    () => (imageDataUri && isRecognizing ? buildOcrHtml(imageDataUri) : null),
    [imageDataUri, isRecognizing],
  );

  async function handleChooseImage() {
    try {
      setErrorMessage(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? "image/jpeg";
      const base64 = asset.base64;

      if (!base64) {
        setErrorMessage(copy.import.screenshotPickError);
        return;
      }

      setImageUri(asset.uri);
      setImageDataUri(`data:${mimeType};base64,${base64}`);
      setOcrText("");
      setProgress(0);
      setSessionKey((current) => current + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.import.screenshotPickError;
      setErrorMessage(message);
    }
  }

  function handleStartRecognition() {
    if (!imageDataUri) {
      setErrorMessage(copy.import.screenshotNeedImage);
      return;
    }

    setErrorMessage(null);
    setProgress(0);
    setIsRecognizing(true);
    setSessionKey((current) => current + 1);
  }

  function handlePreviewImport() {
    try {
      setErrorMessage(null);
      const draft = parseWorkoutImportText(ocrText, "text");
      setImportDraft(draft);
      router.push("/import/preview" as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.import.screenshotParseError;
      setErrorMessage(message);
    }
  }

  function handleOcrMessage(rawData: string) {
    try {
      const payload = JSON.parse(rawData) as
        | { type: "progress"; progress: number }
        | { type: "result"; text: string }
        | { type: "error"; message: string };

      if (payload.type === "progress") {
        setProgress(Math.max(0, Math.min(payload.progress, 1)));
        return;
      }

      if (payload.type === "result") {
        setIsRecognizing(false);
        setProgress(1);
        const curated = curateWorkoutImportText(normalizeOcrText(payload.text));

        if (!curated.rows.length) {
          setOcrText("");
          setErrorMessage(copy.import.screenshotNoValidRows);
          return;
        }

        setOcrText(curated.text);
        return;
      }

      setIsRecognizing(false);
      setErrorMessage(payload.message || copy.import.screenshotRecognizeError);
    } catch {
      setIsRecognizing(false);
      setErrorMessage(copy.import.screenshotRecognizeError);
    }
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
            <Text style={[styles.title, { color: colors.ink }]}>{copy.import.screenshotScreenTitle}</Text>
            <Text style={[styles.body, { color: colors.muted }]}>{copy.import.screenshotScreenBody}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={handleChooseImage}
            style={[styles.primaryAction, { backgroundColor: colors.active }]}
          >
            <Text style={[styles.primaryActionText, { color: colors.canvas }]}>
              {copy.import.chooseScreenshot}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!imageDataUri || isRecognizing}
            onPress={handleStartRecognition}
            style={[
              styles.secondaryAction,
              {
                backgroundColor: imageDataUri ? colors.surface : colors.surfaceRaised,
                borderColor: colors.hairline,
                opacity: imageDataUri ? 1 : 0.48,
              },
            ]}
          >
            <Text style={[styles.secondaryActionText, { color: colors.ink }]}>
              {isRecognizing ? copy.import.recognizing : copy.import.startRecognize}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.supported, { color: colors.quiet }]}>{copy.import.screenshotHintLine}</Text>

        {imageUri ? (
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
          </View>
        ) : null}

        {isRecognizing ? (
          <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <Text style={[styles.progressTitle, { color: colors.ink }]}>{copy.import.recognizing}</Text>
            <Text style={[styles.progressBody, { color: colors.muted }]}>
              {copy.import.screenshotFirstRunHint}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceRaised }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.active, width: `${Math.max(progress * 100, 6)}%` },
                ]}
              />
            </View>
          </View>
        ) : null}

        <Text style={[styles.textLabel, { color: colors.ink }]}>{copy.import.recognizedText}</Text>
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
            onChangeText={setOcrText}
            placeholder={copy.import.recognizedPlaceholder}
            placeholderTextColor={colors.quiet}
            style={[styles.textInput, { color: colors.ink }]}
            value={ocrText}
          />
        </View>

        {errorMessage ? (
          <Text style={[styles.errorText, { color: colors.active }]}>{errorMessage}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!ocrText.trim().length}
          onPress={handlePreviewImport}
          style={[
            styles.previewButton,
            {
              backgroundColor: ocrText.trim().length ? colors.active : colors.surfaceRaised,
            },
          ]}
        >
          <Text
            style={[
              styles.previewButtonText,
              { color: ocrText.trim().length ? colors.canvas : colors.quiet },
            ]}
          >
            {copy.import.previewTitle}
          </Text>
        </Pressable>
      </ScrollView>

      {webViewHtml ? (
        <View pointerEvents="none" style={styles.hiddenWebView}>
          <WebView
            key={sessionKey}
            javaScriptEnabled
            onMessage={(event) => handleOcrMessage(event.nativeEvent.data)}
            originWhitelist={["*"]}
            source={{ html: webViewHtml }}
          />
        </View>
      ) : null}
    </>
  );
}

function normalizeOcrText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[|｜]/g, " ")
    .replace(/[，]/g, ",")
    .replace(/[：]/g, ":")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildOcrHtml(imageDataUri: string) {
  const safeImage = JSON.stringify(imageDataUri);

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
    </head>
    <body>
      <script>
        const imageSrc = ${safeImage};
        const post = (payload) => window.ReactNativeWebView.postMessage(JSON.stringify(payload));

        (async () => {
          try {
            const result = await Tesseract.recognize(imageSrc, "chi_sim+eng", {
              logger: (message) => {
                if (message.status === "recognizing text" && typeof message.progress === "number") {
                  post({ type: "progress", progress: message.progress });
                }
              },
            });
            post({ type: "result", text: result.data.text || "" });
          } catch (error) {
            post({ type: "error", message: error && error.message ? error.message : "OCR failed" });
          }
        })();
      </script>
    </body>
  </html>`;
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
  secondaryAction: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 20,
  },
  secondaryActionText: {
    ...typeRamp.button,
    fontWeight: "600",
  },
  supported: {
    ...typeRamp.micro,
    marginTop: 12,
    textAlign: "center",
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
    overflow: "hidden",
    padding: 12,
  },
  imagePreview: {
    borderRadius: 18,
    height: 220,
    width: "100%",
  },
  progressCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  progressTitle: {
    ...typeRamp.title,
  },
  progressBody: {
    ...typeRamp.micro,
    marginTop: 8,
  },
  progressTrack: {
    borderRadius: 999,
    height: 8,
    marginTop: 16,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    borderRadius: 999,
    height: "100%",
  },
  textLabel: {
    ...typeRamp.caption,
    fontWeight: "600",
    marginTop: 20,
  },
  textInputWrap: {
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 10,
    minHeight: 180,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    ...typeRamp.body,
    minHeight: 150,
    textAlignVertical: "top",
  },
  errorText: {
    ...typeRamp.micro,
    marginTop: 10,
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
  hiddenWebView: {
    height: 1,
    opacity: 0,
    position: "absolute",
    width: 1,
  },
});
