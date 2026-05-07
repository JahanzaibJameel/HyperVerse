import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useColors } from "@/hooks/useColors";

interface IoTDeviceProps {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  status: string;
  value: string;
  active: boolean;
  color: string;
}

export function IoTDevice({ name, icon, status, value, active: initialActive, color }: IoTDeviceProps) {
  const colors = useColors();
  const [active, setActive] = useState(initialActive);
  const scale = useRef(new Animated.Value(1)).current;

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActive((v) => !v);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(scale, { toValue: 1.04, duration: 80, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  };

  const cardBorder =
    Platform.OS === "web"
      ? active
        ? { boxShadow: `0 0 16px ${color}55` } as any
        : {}
      : active
      ? { shadowColor: color, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8 }
      : {};

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.85}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: active ? color + "15" : colors.card,
            borderColor: active ? color + "55" : colors.border,
            transform: Platform.OS !== "web" ? [{ scale }] : [],
            ...cardBorder,
          },
        ]}
      >
        {active && (
          <LinearGradient
            colors={[color + "20", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        )}
        <View style={[styles.iconWrap, { backgroundColor: active ? color + "22" : colors.secondary }]}>
          <MaterialCommunityIcons name={icon} size={24} color={active ? color : colors.mutedForeground} />
        </View>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.value, { color: active ? color : colors.mutedForeground }]}>
          {active ? value : "OFF"}
        </Text>
        <View style={[styles.statusRow]}>
          <View style={[styles.dot, { backgroundColor: active ? color : colors.muted }]} />
          <Text style={[styles.status, { color: active ? color : colors.mutedForeground }]}>
            {active ? status : "inactive"}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 108,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
    marginRight: 12,
    overflow: "hidden",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  value: { fontSize: 12, fontFamily: "Inter_700Bold" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  status: { fontSize: 9, fontFamily: "Inter_400Regular" },
});
