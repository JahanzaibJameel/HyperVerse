import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface GlowCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlowCard({ children, style, glowColor, intensity = "medium" }: GlowCardProps) {
  const colors = useColors();
  const glow = glowColor || colors.cyan;
  const glowAlpha = intensity === "low" ? "1a" : intensity === "medium" ? "33" : "55";
  const blurIntensity = intensity === "low" ? 10 : intensity === "medium" ? 20 : 40;

  const boxShadow =
    Platform.OS === "web"
      ? `0 0 ${intensity === "low" ? 12 : intensity === "medium" ? 20 : 32}px ${glow}44`
      : undefined;

  const nativeShadow =
    Platform.OS !== "web"
      ? {
          shadowColor: glow,
          shadowOpacity: intensity === "low" ? 0.2 : intensity === "medium" ? 0.35 : 0.55,
          shadowRadius: intensity === "low" ? 8 : intensity === "medium" ? 16 : 28,
          shadowOffset: { width: 0, height: 0 },
          elevation: intensity === "low" ? 4 : intensity === "medium" ? 10 : 20,
        }
      : {};

  const Inner = (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            Platform.OS === "web" ? colors.card + "cc" : colors.card,
          borderColor: glow + glowAlpha,
          ...(boxShadow ? { boxShadow } as any : {}),
          ...nativeShadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.outerWrapper, style]}>
        <BlurView intensity={blurIntensity} tint="dark" style={[styles.blurWrapper, { borderColor: glow + glowAlpha }]}>
          {children}
        </BlurView>
      </View>
    );
  }

  return Inner;
}

const styles = StyleSheet.create({
  outerWrapper: {
    borderRadius: 20,
    overflow: "hidden",
  },
  blurWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
});
