import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const NOTIFS = [
  { icon: "lightning-bolt" as const, text: "XP milestone reached! +500 bonus", color: "#ffb800" },
  { icon: "heart-pulse" as const, text: "Heart rate spike detected — relax?", color: "#ff006e" },
  { icon: "robot" as const, text: "AI: New optimization found for your routine", color: "#7c3aed" },
  { icon: "ethereum" as const, text: "NFT evolved to next tier!", color: "#00ff9d" },
  { icon: "home-automation" as const, text: "Smart home: Energy saved 12% today", color: "#00d4ff" },
];

export function NotificationBadge() {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(shake, { toValue: 4, duration: 60, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(shake, { toValue: -4, duration: 60, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(shake, { toValue: 2, duration: 60, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen((v) => !v);
    if (!open) setUnread(0);
  };

  return (
    <View>
      <Animated.View style={{ transform: [{ translateX: shake }] }}>
        <TouchableOpacity onPress={handleOpen} style={styles.bell}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.foreground} />
          {unread > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.pink }]}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {open && (
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {NOTIFS.slice(0, 4).map((n, i) => (
            <TouchableOpacity key={i} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <View style={[styles.notif, { borderBottomColor: colors.border, borderBottomWidth: i < 3 ? 1 : 0 }]}>
                <View style={[styles.notifIcon, { backgroundColor: n.color + "22" }]}>
                  <MaterialCommunityIcons name={n.icon} size={14} color={n.color} />
                </View>
                <Text style={[styles.notifText, { color: colors.foreground }]}>{n.text}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bell: { position: "relative", padding: 4 },
  badge: { position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  panel: { position: "absolute", right: 0, top: 36, width: 260, borderRadius: 14, borderWidth: 1, overflow: "hidden", zIndex: 100 },
  notif: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  notifIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  notifText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
