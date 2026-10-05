import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/lib/stores/authStore";

export function XPBar() {
  const colors = useColors();
  // Screens award XP through `useAuthStore().addXP`, so this store is the only
  // place the app's real level and XP live. The nullish fallbacks keep the bar
  // honest before the unlock gate has rehydrated a profile — level 1, zero XP —
  // rather than standing in a fabricated progress figure.
  const { user } = useAuthStore();
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const xpToNextLevel = user?.xpToNextLevel ?? 1000;

  const progress = useRef(new Animated.Value(0)).current;
  const pct = xp / xpToNextLevel;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 1000,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [progress, pct]);

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
        <Text testID="xp-bar-level" style={[styles.level, { color: colors.cyan }]}>LVL {level}</Text>
        <Text testID="xp-bar-progress" style={[styles.xp, { color: colors.mutedForeground }]}>
          {xp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View testID="xp-bar-fill" style={[styles.fillWrapper, { width: barWidth }]}>
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
