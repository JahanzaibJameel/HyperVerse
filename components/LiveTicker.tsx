import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

interface TickerItem {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const TICKERS: TickerItem[] = [
  { label: "XP Today", value: "+380", change: "streak 12d", positive: true, icon: "lightning-bolt" },
  { label: "Steps Today", value: "8,432", change: "+12%", positive: true, icon: "shoe-sneaker" },
  { label: "Hydration", value: "6/8 cups", change: "On track", positive: true, icon: "water-outline" },
  { label: "Savings", value: "$1,240", change: "+8%", positive: true, icon: "piggy-bank-outline" },
  { label: "AI Assistant", value: "12 chats", change: "New insights", positive: true, icon: "brain" },
];

export function LiveTicker() {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!width) return;
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration: 18000,
        useNativeDriver: Platform.OS !== "web",
      })
    );
    anim.start();
    return () => anim.stop();
  }, [width, translateX]);

  const items = [...TICKERS, ...TICKERS];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <MaterialCommunityIcons name={item.icon} size={12} color={colors.mutedForeground} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>{item.label}</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{item.value}</Text>
            <Text style={[styles.change, { color: item.positive ? colors.green : colors.destructive }]}>
              {item.change}
            </Text>
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 32, overflow: "hidden", borderBottomWidth: 1 },
  track: { flexDirection: "row", height: 32, alignItems: "center" },
  item: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8 },
  label: { fontSize: 10, fontFamily: "Inter_400Regular" },
  value: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  change: { fontSize: 10, fontFamily: "Inter_500Medium" },
  sep: { width: 1, height: 14, marginLeft: 4 },
});
