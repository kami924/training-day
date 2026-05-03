import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "add",
};

export default function SetupLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        animationMatchesGesture: true,
        fullScreenGestureEnabled: true,
        gestureEnabled: true,
        headerShown: false,
      }}
    />
  );
}
