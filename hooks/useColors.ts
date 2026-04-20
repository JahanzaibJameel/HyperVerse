import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

type Palette = typeof colors.light;

export function useColors(): Palette & { radius: number } {
  const scheme = useColorScheme();
  const palette: Palette =
    scheme === "dark" ? (colors.dark as Palette) : (colors.light as Palette);
  return { ...palette, radius: colors.radius };
}
