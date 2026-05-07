import React, { useRef } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";

interface NFTCardProps {
  name: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  xp: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  earned: boolean;
}

const rarityColors: Record<string, string> = {
  Common: "#a0b4cc",
  Rare: "#00d4ff",
  Epic: "#7c3aed",
  Legendary: "#ffb800",
};

const rarityGradients: Record<string, [string, string]> = {
  Common: ["#a0b4cc22", "#1a2f4a"],
  Rare: ["#00d4ff22", "#0d1a2e"],
  Epic: ["#7c3aed22", "#0d1a2e"],
  Legendary: ["#ffb80022", "#1a1000"],
};

export function NFTCard({ name, rarity, xp, icon, earned }: NFTCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const rarityColor = rarityColors[rarity];
  const [g1, g2] = rarityGradients[rarity];

  const handlePress = () => {
    if (!earned) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(scale, { toValue: 1.06, duration: 100, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  };

  const cardShadow =
    Platform.OS === "web"
      ? earned
        ? ({ boxShadow: `0 0 20px ${rarityColor}55` } as any)
        : {}
      : earned
      ? { shadowColor: rarityColor, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 10 }
      : {};

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: earned ? rarityColor + "55" : colors.border,
            transform: Platform.OS !== "web" ? [{ scale }] : [],
            opacity: earned ? 1 : 0.4,
            ...cardShadow,
          },
        ]}
      >
        <LinearGradient
          colors={earned ? [g1, g2] : [colors.card, colors.card]}
          style={StyleSheet.absoluteFill}
        />
        {/* Rarity indicator glow */}
        {earned && (
          <View style={[styles.rarityGlow, { backgroundColor: rarityColor + "18" }]} />
        )}
        <View style={[styles.iconBg, { backgroundColor: rarityColor + "22" }]}>
          <MaterialCommunityIcons name={icon} size={28} color={earned ? rarityColor : colors.mutedForeground} />
        </View>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>{name}</Text>
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor + "20", borderColor: rarityColor + "44", borderWidth: 1 }]}>
          <Text style={[styles.rarity, { color: rarityColor }]}>{rarity}</Text>
        </View>
        <Text style={[styles.xp, { color: colors.mutedForeground }]}>+{xp} XP</Text>
        {earned && (
          <View style={[styles.earnedBadge, { backgroundColor: rarityColor + "22" }]}>
            <MaterialCommunityIcons name="check-decagram" size={10} color={rarityColor} />
            <Text style={[styles.earnedText, { color: rarityColor }]}>OWNED</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 128,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 8,
    marginRight: 12,
    overflow: "hidden",
    position: "relative",
  },
  rarityGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center", lineHeight: 16 },
  rarityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rarity: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  xp: { fontSize: 11, fontFamily: "Inter_400Regular" },
  earnedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  earnedText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
});
