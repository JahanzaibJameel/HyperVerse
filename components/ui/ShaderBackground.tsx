import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useThemeStore } from "@/lib/stores/themeStore";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ShaderBackgroundProps {
  children: React.ReactNode;
  shaderType?: "cyberpunk" | "matrix" | "wave" | "plasma";
  primaryColor?: string;
  intensity?: number;
  animationSpeed?: number;
  onIntensityChange?: (intensity: number) => void;
  onColorChange?: (color: string) => void;
}

type ShaderType = NonNullable<ShaderBackgroundProps["shaderType"]>;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Animated gradient backdrop approximating the previous Skia shader effects.
 * Runs on the UI thread via Reanimated so it stays smooth without a native
 * graphics dependency.
 */
export const ShaderBackground: React.FC<ShaderBackgroundProps> = ({
  children,
  shaderType = "cyberpunk",
  primaryColor = "#00ffff",
  intensity = 0.7,
  animationSpeed = 1,
  onIntensityChange,
  onColorChange,
}) => {
  const { themeMode } = useThemeStore();

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: 4000 / Math.max(animationSpeed, 0.1),
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [animationSpeed, progress]);

  useEffect(() => {
    onIntensityChange?.(intensity);
    onColorChange?.(primaryColor);
  }, [intensity, primaryColor, onIntensityChange, onColorChange]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + intensity * 0.35 * progress.value,
    transform: [
      { scale: 1 + progress.value * 0.12 },
      { translateX: (progress.value - 0.5) * 40 },
      { translateY: (progress.value - 0.5) * 40 },
    ],
  }));

  const gradientStyle = getGradientStyle(shaderType);
  const isDark = themeMode !== "light";

  return (
    <View style={styles.container} pointerEvents="none">
      <AnimatedLinearGradient
        colors={gradientStyle.colors}
        start={gradientStyle.start}
        end={gradientStyle.end}
        locations={gradientStyle.locations}
        style={[StyleSheet.absoluteFill, animatedStyle]}
      />

      <View style={[styles.veil, { backgroundColor: isDark ? "#000000" : "#ffffff" }]} />

      <View style={styles.contentOverlay}>{children}</View>
    </View>
  );
};

function getGradientStyle(type: ShaderType) {
  switch (type) {
    case "matrix":
      return {
        colors: ["#000000", "#003b00", "#00ff41", "#000000"] as const,
        start: { x: 0, y: 0 } as const,
        end: { x: 0, y: 1 } as const,
        locations: [0, 0.35, 0.65, 1] as const,
      };
    case "wave":
      return {
        colors: ["#00d4ff", "#a855f7", "#00d4ff", "#00d4ff"] as const,
        start: { x: 0, y: 0 } as const,
        end: { x: 1, y: 1 } as const,
        locations: [0, 0.33, 0.66, 1] as const,
      };
    case "plasma":
      return {
        colors: ["#7c3aed", "#ec4899", "#00d4ff", "#7c3aed"] as const,
        start: { x: 0, y: 0 } as const,
        end: { x: 1, y: 0 } as const,
        locations: [0, 0.33, 0.66, 1] as const,
      };
    case "cyberpunk":
    default:
      return {
        colors: ["#000000", "#001a2e", "#2d0033", "#000000"] as const,
        start: { x: 0, y: 0 } as const,
        end: { x: 1, y: 1 } as const,
        locations: [0, 0.33, 0.66, 1] as const,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    overflow: "hidden",
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  contentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    zIndex: 10,
  },
});
