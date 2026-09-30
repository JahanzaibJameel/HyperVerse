import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";

import { GlowCard } from "@/components/GlowCard";
import { StatBar } from "@/components/StatBar";
import { XPBar } from "@/components/XPBar";
import { LiveTicker } from "@/components/LiveTicker";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useAuthStore } from "@/lib/stores/authStore";
import { HealthRepository } from "@/lib/database/repositories/HealthRepository";
import { FinanceRepository } from "@/lib/database/repositories/FinanceRepository";
import { TaskRepository } from "@/lib/database/repositories/TaskRepository";
import { useColors } from "@/hooks/useColors";

const LIVE_EVENTS = [
  { text: "QuantumX just claimed a Legendary NFT", icon: "star" as const, color: "#ffb800" },
  { text: "AR City challenge live now — join!", icon: "virtual-reality" as const, color: "#00d4ff" },
  { text: "Your smart thermostat saved 8% energy", icon: "home-automation" as const, color: "#00ff9d" },
];

const EMPTY_HEALTH = {
  steps: 0,
  stepsGoal: 10000,
  calories: 0,
  sleep: 0,
  heartRate: 0,
  workouts: 0,
};

const EMPTY_FINANCE = {
  balance: 0,
  income: 0,
  expenses: 0,
  savings: 0,
  investments: 0,
  budgetUsed: 0,
};

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [health, setHealth] = useState(EMPTY_HEALTH);
  const [finance, setFinance] = useState(EMPTY_FINANCE);
  const [openTasks, setOpenTasks] = useState(0);
  const [eventIdx, setEventIdx] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    const t = setInterval(() => setEventIdx((i) => (i + 1) % LIVE_EVENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!user?.dbId) return;
    try {
      const [metric, financeSummary, tasks] = await Promise.all([
        HealthRepository.findLatest(user.dbId),
        FinanceRepository.summary(user.dbId),
        TaskRepository.findByUser(user.dbId),
      ]);

      setHealth(
        metric
          ? {
              steps: metric.steps,
              stepsGoal: metric.stepsGoal,
              calories: metric.calories,
              sleep: metric.sleepHours,
              heartRate: metric.heartRate,
              workouts: metric.workouts,
            }
          : EMPTY_HEALTH
      );

      setFinance(financeSummary);
      setOpenTasks(tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  }, [user?.dbId]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const ev = LIVE_EVENTS[eventIdx];

  // Insights are derived from the user's own records rather than hardcoded strings.
  const suggestions = (() => {
    const items: { icon: "lightning-bolt" | "chart-line" | "robot" | "fire"; text: string; color: string }[] = [];

    if (health.steps > 0 && health.steps >= health.stepsGoal) {
      items.push({ icon: "fire", text: `${health.steps.toLocaleString()} steps — goal reached!`, color: "#ffb800" });
    } else if (health.steps > 0) {
      items.push({
        icon: "fire",
        text: `${(health.stepsGoal - health.steps).toLocaleString()} steps to go today`,
        color: "#ffb800",
      });
    }

    if (health.sleep > 0) {
      items.push({
        icon: "robot",
        text: `Sleep: ${health.sleep.toFixed(1)}h — ${health.sleep >= 7 ? "well rested" : "consider an early night"}`,
        color: "#00d4ff",
      });
    }

    if (health.heartRate > 100) {
      items.push({ icon: "lightning-bolt", text: "Heart rate elevated — consider a walk", color: "#ff6b00" });
    }

    if (finance.income > 0 && finance.expenses > 0) {
      const rate = Math.round((1 - finance.expenses / finance.income) * 100);
      items.push({
        icon: "chart-line",
        text: `Savings rate ${rate}% — ${rate >= 20 ? "great work" : "room to improve"}`,
        color: "#00ff9d",
      });
    }

    if (openTasks > 0) {
      items.push({ icon: "lightning-bolt", text: `${openTasks} open task${openTasks === 1 ? "" : "s"} waiting`, color: "#7c3aed" });
    }

    if (items.length === 0) {
      items.push({ icon: "robot", text: "Add tasks, habits, or health data to unlock insights", color: "#00d4ff" });
    }

    return items.slice(0, 4);
  })();

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
            <Text style={[styles.username, { color: colors.foreground }]}>{user?.name || "User"}</Text>
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
              <Text style={[styles.levelText, { color: colors.cyan }]}>LVL {user?.level || 1}</Text>
            </View>
            <View style={styles.streakRow}>
              <MaterialCommunityIcons name="fire" size={14} color={colors.warning} />
              <Text style={[styles.streakText, { color: colors.warning }]}>{user?.streak || 0} STREAK</Text>
            </View>
            <View style={[styles.tokenRow, { backgroundColor: colors.warning + "15" }]}>
              <MaterialCommunityIcons name="hexagon-outline" size={12} color={colors.warning} />
              <Text style={[styles.tokenText, { color: colors.warning }]}>{(user?.tokens || 0).toLocaleString()}</Text>
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
            { icon: "moon-waning-crescent" as const, val: health.sleep > 0 ? `${health.sleep.toFixed(1)}h` : "—", label: "SLEEP", color: colors.cyan },
            { icon: "clipboard-check-outline" as const, val: String(openTasks), label: "TASKS", color: colors.purple },
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
          <StatBar label="Workouts" value={health.workouts} max={7} color={colors.purple} />
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

        {/* Insights */}
        <Animated.View entering={FadeInUp.duration(800).delay(700)}>
          <GlowCard glowColor={colors.purple} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="brain" size={16} color={colors.purple} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>INSIGHTS</Text>
          </View>
          {suggestions.map((s, i) => (
            <View key={i} style={[styles.suggestion, { borderBottomColor: colors.border, borderBottomWidth: i < suggestions.length - 1 ? 1 : 0 }]}>
              <View style={[styles.sugIcon, { backgroundColor: s.color + "20" }]}>
                <MaterialCommunityIcons name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={[styles.sugText, { color: colors.foreground }]}>{s.text}</Text>
            </View>
          ))}
          </GlowCard>
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
});