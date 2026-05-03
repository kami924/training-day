import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors } from "@/constants/theme";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { AppThemeProvider, useAppTheme } from "@/theme/AppThemeProvider";
import { TrainingProvider } from "@/training/TrainingProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <AppThemeProvider>
        <LanguageProvider>
          <TrainingProvider>
            <RootStack />
          </TrainingProvider>
        </LanguageProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { colors: themeColors } = useAppTheme();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themeColors.canvas },
          animation: "slide_from_right",
          animationMatchesGesture: true,
          gestureDirection: "horizontal",
          gestureEnabled: true,
        }}
      />
    </>
  );
}
