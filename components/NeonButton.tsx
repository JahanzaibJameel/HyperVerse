import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { Animated, Platform, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  size?: "sm" | "md" | "lg";
  filled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  disabled?: boolean;
}

export function NeonButton({ 
  label, 
  onPress, 
  color, 
  style, 
  size = "md", 
  filled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
  disabled = false
}: NeonButtonProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const glowColor = color || colors.cyan;

  const nativeDriven = Platform.OS !== "web";

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: nativeDriven }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: nativeDriven }),
    ]).start();
    onPress();
  };

  const padding =
    size === "sm" ? { paddingVertical: 8, paddingHorizontal: 16 } :
    size === "lg" ? { paddingVertical: 16, paddingHorizontal: 32 } :
    { paddingVertical: 12, paddingHorizontal: 24 };

  const fontSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;

  const glowShadow = Platform.OS === "web"
    ? ({ boxShadow: `0 0 14px ${glowColor}88` } as any)
    : { shadowColor: glowColor, shadowOpacity: 0.65, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 };

  return (
    <Animated.View style={[{ transform: nativeDriven ? [{ scale }] : [] }, style]}>
      <TouchableOpacity 
        onPress={handlePress} 
        activeOpacity={0.8}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ disabled }}
      >
        {filled ? (
          <LinearGradient
            colors={[glowColor + "dd", glowColor + "99"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, padding, glowShadow, { borderColor: glowColor, opacity: disabled ? 0.5 : 1 }]}
          >
            <Text style={[styles.label, { color: "#fff", fontSize }]}>{label}</Text>
          </LinearGradient>
        ) : (
          <Animated.View
            style={[
              styles.button,
              padding,
              glowShadow,
              { 
                borderColor: glowColor, 
                backgroundColor: glowColor + "15",
                opacity: disabled ? 0.5 : 1
              },
            ]}
          >
            <Text style={[styles.label, { color: glowColor, fontSize }]}>{label}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
