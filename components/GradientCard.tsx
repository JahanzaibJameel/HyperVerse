import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface GradientCardProps {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function GradientCard({
  children,
  colors: gradientColors,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientCardProps) {
  const themeColors = useColors();
  const defaultColors: readonly [string, string] = [
    themeColors.cyan + "22",
    themeColors.purple + "11",
  ];

  return (
    <LinearGradient
      colors={gradientColors ?? defaultColors}
      start={start}
      end={end}
      style={[
        styles.card,
        { borderColor: themeColors.border },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
  },
});
