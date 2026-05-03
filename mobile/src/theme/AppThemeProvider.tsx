import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import { MuscleGroup } from "@/types/training";

export type ColorMode = "dark" | "light";

type ThemePreset = {
  active: string;
  activeDeep: string;
  activeDim: string;
  canvas: string;
  canvasMuted: string;
  hairline: string;
  ink: string;
  muted: string;
  quiet: string;
  ringTrack: string;
  surface: string;
  surfaceRaised: string;
  tab: string;
};

export type AppPalette = ThemePreset;

export const defaultMuscleColors: Record<MuscleGroup, string> = {
  胸: "#FF4F6D",
  肩: "#FFB629",
  背: "#39A8FF",
  臀腿: "#B8FF2C",
  手臂: "#9B7CFF",
  腹部: "#35E6C5",
  自定义: "#F6F6F7",
};

const themePresets: Record<ColorMode, ThemePreset> = {
  dark: {
    active: "#F6F6F7",
    activeDeep: "rgba(246, 246, 247, 0.22)",
    activeDim: "rgba(246, 246, 247, 0.2)",
    canvas: "#000000",
    canvasMuted: "rgba(255, 255, 255, 0.64)",
    hairline: "rgba(255, 255, 255, 0.1)",
    ink: "#F6F6F7",
    muted: "#9C9CA2",
    quiet: "#595B63",
    ringTrack: "rgba(255, 255, 255, 0.1)",
    surface: "#15161A",
    surfaceRaised: "#202127",
    tab: "rgba(29, 30, 34, 0.92)",
  },
  light: {
    active: "#111114",
    activeDeep: "rgba(17, 17, 20, 0.18)",
    activeDim: "rgba(17, 17, 20, 0.14)",
    canvas: "#F6F4EF",
    canvasMuted: "rgba(0, 0, 0, 0.58)",
    hairline: "rgba(0, 0, 0, 0.1)",
    ink: "#111114",
    muted: "#686A70",
    quiet: "#8A8D92",
    ringTrack: "rgba(0, 0, 0, 0.11)",
    surface: "#FFFFFF",
    surfaceRaised: "#ECE9E2",
    tab: "rgba(255, 255, 255, 0.92)",
  },
};

type AppThemeContextValue = {
  accentColor: string;
  colorMode: ColorMode;
  colors: AppPalette;
  muscleColors: Record<MuscleGroup, string>;
  setShowHomeMuscles: (showHomeMuscles: boolean) => void;
  setAccentColor: (accentColor: string) => void;
  setColorMode: (colorMode: ColorMode) => void;
  setMuscleColor: (muscle: MuscleGroup, color: string) => void;
  showHomeMuscles: boolean;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [colorMode, setColorMode] = useState<ColorMode>("dark");
  const [accentColor, setAccentColor] = useState("#FF3B30");
  const [showHomeMuscles, setShowHomeMuscles] = useState(true);
  const [muscleColors, setMuscleColors] =
    useState<Record<MuscleGroup, string>>(defaultMuscleColors);

  const setMuscleColor = (muscle: MuscleGroup, color: string) => {
    setMuscleColors((current) => ({
      ...current,
      [muscle]: color,
    }));
  };

  const value = useMemo(() => {
    const base = themePresets[colorMode];
    const accent = createAccentPalette(accentColor);

    return {
      accentColor,
      colorMode,
      colors: {
        ...base,
        active: accent.active,
        activeDeep: accent.activeDeep,
        activeDim: accent.activeDim,
      },
      muscleColors,
      setShowHomeMuscles,
      setAccentColor,
      setColorMode,
      setMuscleColor,
      showHomeMuscles,
    };
  }, [accentColor, colorMode, muscleColors, showHomeMuscles]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

function createAccentPalette(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  return {
    active: hex,
    activeDeep: `rgba(${r}, ${g}, ${b}, 0.22)`,
    activeDim: `rgba(${r}, ${g}, ${b}, 0.2)`,
  };
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);

  if (!value) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }

  return value;
}
