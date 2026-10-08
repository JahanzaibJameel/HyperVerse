import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { useThemeStore } from "@/lib/stores/themeStore";

type Palette = typeof colors.light;

export function useColors(): Palette & { radius: number } {
  const themeMode = useThemeStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  const scheme =
    themeMode === "system"
      ? systemScheme
      : themeMode;

  const palette: Palette =
    scheme === "dark" ? (colors.dark as Palette) : (colors.light as Palette);
  return { ...palette, radius: colors.radius };
}