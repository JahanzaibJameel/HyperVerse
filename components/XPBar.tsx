import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export function XPBar() {
  const colors = useColors();
  const { user } = useApp();
  const progress = useRef(new Animated.Value(0)).current;
  const pct = user.xp / user.xpToNextLevel;

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
      ? ({ boxShadow: `0 0 12px ${colors.cyan}aa` } as any)
      : {
          shadowColor: colors.cyan,
          shadowOpacity: 0.9,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
        };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.level, { color: colors.cyan }]}>LVL {user.level}</Text>
        <Text style={[styles.xp, { color: colors.mutedForeground }]}>
          {user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()} XP
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.fillWrapper, { width: barWidth }]}>
          <LinearGradient
            colors={[colors.cyan, colors.purple]}
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
  container: { marginVertical: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  level: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  xp: { fontSize: 11, fontFamily: "Inter_400Regular" },
  track: { height: 10, borderRadius: 5, overflow: "hidden" },
  fillWrapper: { height: "100%", overflow: "hidden", borderRadius: 5 },
  fill: { flex: 1 },
});
