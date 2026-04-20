import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  unit?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularProgress({
  value,
  max,
  size = 90,
  strokeWidth = 8,
  color,
  label,
  unit = "",
}: CircularProgressProps) {
  const colors = useColors();
  const pct = Math.min(value / max, 1);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useRef(new Animated.Value(0)).current;
  const gradId = `grad_${label.replace(/\s/g, "")}`;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const displayVal = value >= 10000 ? `${(value / 1000).toFixed(1)}k` : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.6" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: colors.foreground }]}>{displayVal}</Text>
        {unit ? <Text style={[styles.unit, { color: colors.mutedForeground }]}>{unit}</Text> : null}
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center" },
  value: { fontSize: 17, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 9, fontFamily: "Inter_500Medium" },
  label: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginTop: 1 },
});
