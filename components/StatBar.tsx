import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}

export function StatBar({ label, value, max, color, unit }: StatBarProps) {
  const colors = useColors();
  const progress = useRef(new Animated.Value(0)).current;
  const pct = Math.min(value / max, 1);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const glowStyle =
    Platform.OS === "web"
      ? ({ boxShadow: `0 0 8px ${color}88` } as any)
      : {
          shadowColor: color,
          shadowOpacity: 0.7,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        };

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {value.toLocaleString()}
            {unit ? ` ${unit}` : ""}
          </Text>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.fillWrapper, { width: barWidth }]}>
          <LinearGradient
            colors={[color + "cc", color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, glowStyle]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium" },
  value: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  track: { height: 7, borderRadius: 4, overflow: "hidden" },
  fillWrapper: { height: "100%", overflow: "hidden", borderRadius: 4 },
  fill: { flex: 1 },
});
