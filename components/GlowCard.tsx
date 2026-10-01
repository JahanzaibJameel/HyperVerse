import { BlurView } from "expo-blur";
import React from "react";
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface GlowCardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
  onPress?: () => void;
}

export function GlowCard({ children, style, glowColor, intensity = "medium", onPress }: GlowCardProps) {
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

  const Card = onPress ? Pressable : View;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: Platform.OS === "web" ? colors.card + "cc" : colors.card,
      borderColor: glow + glowAlpha,
      ...(boxShadow ? { boxShadow } as any : {}),
      ...nativeShadow,
    },
    style,
  ];

  // iOS keeps the blur treatment, but it has to stay inside the same `Card` tree.
  // Returning a separate branch here would drop `onPress` entirely and apply
  // `style` a second time, making every tappable card inert on iOS.
  const content =
    Platform.OS === "ios" ? (
      <BlurView intensity={blurIntensity} tint="dark" style={styles.blurWrapper}>
        {children}
      </BlurView>
    ) : (
      children
    );

  return (
    <Card onPress={onPress} style={cardStyle}>
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  // The card already supplies the radius, border, and padding; the blur layer
  // only needs to clip its content to those bounds.
  blurWrapper: {
    borderRadius: 20,
    overflow: "hidden",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
});
