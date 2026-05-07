import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { GlowCard } from "@/components/GlowCard";
import { StatBar } from "@/components/StatBar";
import { XPBar } from "@/components/XPBar";
import { LiveTicker } from "@/components/LiveTicker";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const SUGGESTIONS = [
  { icon: "lightning-bolt" as const, text: "Heart rate elevated — consider a walk", color: "#ff6b00" },
  { icon: "chart-line" as const, text: "Portfolio up 4.2% — great week!", color: "#00ff9d" },
  { icon: "robot" as const, text: "Sleep score: 84 — well rested", color: "#00d4ff" },
  { icon: "fire" as const, text: "12 day streak — keep it up!", color: "#ffb800" },
];

const LIVE_EVENTS = [
  { text: "QuantumX just claimed a Legendary NFT", icon: "star" as const, color: "#ffb800" },
  { text: "AR City challenge live now — join!", icon: "virtual-reality" as const, color: "#00d4ff" },
  { text: "Your smart thermostat saved 8% energy", icon: "home-automation" as const, color: "#00ff9d" },
];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, health, finance } = useApp();
  const [eventIdx, setEventIdx] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    const t = setInterval(() => setEventIdx((i) => (i + 1) % LIVE_EVENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const ev = LIVE_EVENTS[eventIdx];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 120 : 100 }}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >
      {/* Sticky ticker */}
      <LiveTicker />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(600).delay(200)}
          style={[styles.header, { paddingTop: topPad + 16 }]}
        >
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>GOOD MORNING</Text>
            <Text style={[styles.username, { color: colors.foreground }]}>{user.name}</Text>
          </View>
          <NotificationBadge />
        </Animated.View>

        {/* Hero gradient card */}
        <Animated.View entering={FadeInUp.duration(800).delay(300)}>
          <LinearGradient
            colors={["#0d1a2e", "#0a1628", "#070e1c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: colors.cyan + "33" }]}
          >
          {/* Glow effect top-right */}
          <View style={[styles.heroGlow, { backgroundColor: colors.cyan }]} />
          <View style={[styles.heroGlowPurple, { backgroundColor: colors.purple }]} />

          <View style={styles.levelRow}>
            <View style={[styles.levelBadge, { backgroundColor: colors.cyan + "22", borderColor: colors.cyan + "44" }]}>
              <Text style={[styles.levelText, { color: colors.cyan }]}>LVL {user.level}</Text>
            </View>
            <View style={styles.streakRow}>
              <MaterialCommunityIcons name="fire" size={14} color={colors.warning} />
              <Text style={[styles.streakText, { color: colors.warning }]}>{user.streak} STREAK</Text>
            </View>
            <View style={[styles.tokenRow, { backgroundColor: colors.warning + "15" }]}>
              <MaterialCommunityIcons name="hexagon-outline" size={12} color={colors.warning} />
              <Text style={[styles.tokenText, { color: colors.warning }]}>{user.tokens.toLocaleString()}</Text>
            </View>
          </View>

          <XPBar />

          {/* Live event banner */}
          <View style={[styles.eventBanner, { backgroundColor: ev.color + "15", borderColor: ev.color + "33" }]}>
            <MaterialCommunityIcons name={ev.icon} size={14} color={ev.color} />
            <Text style={[styles.eventText, { color: ev.color }]} numberOfLines={1}>{ev.text}</Text>
          </View>
        </LinearGradient>
        </Animated.View>

        {/* Quick stats grid */}
        <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.statsGrid}>
          {[
            { icon: "shoe-sneaker" as const, val: health.steps.toLocaleString(), label: "STEPS", color: colors.green },
            { icon: "heart-pulse" as const, val: String(health.heartRate), label: "BPM", color: colors.pink },
            { icon: "moon-waning-crescent" as const, val: `${health.sleep}h`, label: "SLEEP", color: colors.cyan },
            { icon: "ethereum" as const, val: String(user.nfts), label: "NFTs", color: colors.purple },
          ].map((s, i) => (
            <GlowCard key={i} style={styles.statCard} glowColor={s.color}>
              <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </GlowCard>
          ))}
        </Animated.View>

        {/* Health bar */}
        <Animated.View entering={FadeInUp.duration(800).delay(500)}>
          <GlowCard glowColor={colors.green} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="heart-pulse" size={16} color={colors.green} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>HEALTH</Text>
            <View style={[styles.liveDot, { backgroundColor: colors.green }]} />
          </View>
          <StatBar label="Steps" value={health.steps} max={health.stepsGoal} color={colors.green} />
          <StatBar label="Calories" value={health.calories} max={2500} color={colors.orange} unit="kcal" />
          <StatBar label="Sleep quality" value={84} max={100} color={colors.cyan} unit="%" />
          </GlowCard>
        </Animated.View>

        {/* Finance summary */}
        <Animated.View entering={FadeInUp.duration(800).delay(600)}>
          <GlowCard glowColor={colors.warning} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-line" size={16} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>FINANCE</Text>
          </View>
          <View style={styles.finRow}>
            {[
              { val: `$${finance.income.toLocaleString()}`, label: "INCOME", color: colors.green },
              { val: `$${finance.expenses.toLocaleString()}`, label: "SPENT", color: colors.pink },
              { val: `$${finance.balance.toLocaleString()}`, label: "NET WORTH", color: colors.cyan },
            ].map((f, i) => (
              <View key={i} style={styles.finItem}>
                <Text style={[styles.finVal, { color: f.color }]}>{f.val}</Text>
                <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
              </View>
            ))}
          </View>
          </GlowCard>
        </Animated.View>

        {/* AI suggestions */}
        <Animated.View entering={FadeInUp.duration(800).delay(700)}>
          <GlowCard glowColor={colors.purple} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="brain" size={16} color={colors.purple} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI INSIGHTS</Text>
          </View>
          {SUGGESTIONS.map((s, i) => (
            <View key={i} style={[styles.suggestion, { borderBottomColor: colors.border, borderBottomWidth: i < SUGGESTIONS.length - 1 ? 1 : 0 }]}>
              <View style={[styles.sugIcon, { backgroundColor: s.color + "20" }]}>
                <MaterialCommunityIcons name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={[styles.sugText, { color: colors.foreground }]}>{s.text}</Text>
            </View>
          ))}
          </GlowCard>
        </Animated.View>

        {/* AR city teaser */}
        <Animated.View entering={FadeInUp.duration(800).delay(800)}>
          <LinearGradient
            colors={["#0d1a2e", "#120828"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.arTeaser, { borderColor: colors.purple + "44" }]}
          >
          <View style={styles.arTeaserContent}>
            <MaterialCommunityIcons name="city-variant-outline" size={32} color={colors.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.arTeaserTitle, { color: colors.foreground }]}>AR CITY OVERLAY</Text>
              <Text style={[styles.arTeaserSub, { color: colors.mutedForeground }]}>4 objects detected nearby</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.purple} />
          </View>
          <View style={styles.arTeaserStats}>
            {[{ val: "#3", label: "Global Rank" }, { val: "24", label: "Active Nodes" }, { val: "2", label: "Raids Live" }].map((s, i) => (
              <View key={i} style={styles.arStat}>
                <Text style={[styles.arStatVal, { color: colors.purple }]}>{s.val}</Text>
                <Text style={[styles.arStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  username: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, overflow: "hidden" },
  heroGlow: { position: "absolute", width: 120, height: 120, borderRadius: 60, top: -40, right: -20, opacity: 0.08 },
  heroGlowPurple: { position: "absolute", width: 80, height: 80, borderRadius: 40, bottom: 0, left: 40, opacity: 0.06 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  levelText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tokenRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: "auto" as any },
  tokenText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  eventBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  eventText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  sectionCard: { marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 2, flex: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  finRow: { flexDirection: "row", justifyContent: "space-around" },
  finItem: { alignItems: "center", gap: 4 },
  finVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  finLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 1 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  sugIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sugText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  arTeaser: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, overflow: "hidden" },
  arTeaserContent: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  arTeaserTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  arTeaserSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  arTeaserStats: { flexDirection: "row", justifyContent: "space-around" },
  arStat: { alignItems: "center" },
  arStatVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  arStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
});
