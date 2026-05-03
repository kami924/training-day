import { TextStyle } from "react-native";

export const colors = {
  canvas: "#000000",
  canvasMuted: "rgba(255, 255, 255, 0.64)",
  surface: "#16171A",
  surfaceRaised: "#1F2024",
  ink: "#F6F6F7",
  muted: "#9C9CA2",
  hairline: "#2B2C31",
  quiet: "#595B63",
  active: "#EA2D5E",
  activeDim: "rgba(234, 45, 94, 0.2)",
  activeDeep: "#3B0718",
  tab: "rgba(29, 30, 34, 0.92)",
};

export const rhythm = {
  page: 28,
};

export const typeRamp = {
  display: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "200",
    letterSpacing: 0,
  } satisfies TextStyle,
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "300",
    letterSpacing: 0,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "300",
    letterSpacing: 0,
  } satisfies TextStyle,
  button: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "300",
    letterSpacing: 0,
  } satisfies TextStyle,
  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
    letterSpacing: 0,
  } satisfies TextStyle,
  micro: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "400",
    letterSpacing: 0,
  } satisfies TextStyle,
};
