import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlowCard } from "@/components/GlowCard";
import { StatBar } from "@/components/StatBar";
import { CircularProgress } from "@/components/CircularProgress";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const WORKOUTS = [
  { type: "Morning Run", duration: "32 min", cal: 310, icon: "run" as const, date: "Today" },
  { type: "HIIT Circuit", duration: "25 min", cal: 280, icon: "lightning-bolt" as const, date: "Yesterday" },
  { type: "Yoga Flow", duration: "45 min", cal: 180, icon: "yoga" as const, date: "Mon" },
];

const SLEEP_DATA = [6.5, 7.2, 8.1, 7.4, 6.8, 7.9, 7.4];
const SLEEP_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ACHIEVEMENTS = [
  { name: "Speed Demon", icon: "speedometer" as const, desc: "10K steps in a day", earned: true, color: "#00d4ff" },
  { name: "Night Owl", icon: "moon-waning-crescent" as const, desc: "Perfect sleep 7 days", earned: true, color: "#7c3aed" },
  { name: "Iron Will", icon: "dumbbell" as const, desc: "30 workouts/month", earned: false, color: "#ffb800" },
  { name: "Marathon", icon: "run-fast" as const, desc: "Run 42km total", earned: false, color: "#ff006e" },
  { name: "Zen Master", icon: "meditation" as const, desc: "21 days meditation", earned: true, color: "#00ff9d" },
  { name: "Calorie King", icon: "fire" as const, desc: "Burn 500 kcal/day × 30", earned: false, color: "#ff6b00" },
];

export default function HealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { health, addXP } = useApp();
  const [loggedWorkout, setLoggedWorkout] = useState(false);
  const [loggedMeditation, setLoggedMeditation] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleLogWorkout = () => {
    if (!loggedWorkout) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addXP(150);
      setLoggedWorkout(true);
    }
  };

  const handleMeditation = () => {
    if (!loggedMeditation) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addXP(75);
      setLoggedMeditation(true);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === "web" ? 120 : 100,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>HEALTH HQ</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>Biometric sync live</Text>
        </View>
        <View style={[styles.wearableBadge, { borderColor: colors.green + "55", backgroundColor: colors.green + "12" }]}>
          <View style={[styles.wearableDot, { backgroundColor: colors.green }]} />
          <Text style={[styles.wearableText, { color: colors.green }]}>WEARABLE</Text>
        </View>
      </View>

      {/* Circular rings */}
      <LinearGradient
        colors={["#0d1a2e", "#081420"]}
        style={[styles.ringsCard, { borderColor: colors.border }]}
      >
        <Text style={[styles.ringsTitle, { color: colors.mutedForeground }]}>TODAY'S RINGS</Text>
        <View style={styles.ringsRow}>
          <CircularProgress value={health.steps} max={health.stepsGoal} size={100} color={colors.green} label="STEPS" />
          <CircularProgress value={health.calories} max={2500} size={100} color={colors.orange} label="KCAL" />
          <CircularProgress value={health.sleep * 10} max={85} size={100} color={colors.cyan} label="SLEEP" unit="h" />
        </View>
        <View style={styles.ringsRow}>
          <CircularProgress value={health.heartRate} max={100} size={80} strokeWidth={6} color={colors.pink} label="BPM" />
          <CircularProgress value={health.workouts} max={5} size={80} strokeWidth={6} color={colors.purple} label="WRKT" />
          <CircularProgress value={72} max={120} size={80} strokeWidth={6} color={colors.warning} label="MIN" />
        </View>
      </LinearGradient>

      {/* Sleep history */}
      <GlowCard glowColor={colors.cyan} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="sleep" size={16} color={colors.cyan} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>SLEEP ANALYSIS</Text>
          <Text style={[styles.cardSub, { color: colors.cyan }]}>7-day avg: 7.3h</Text>
        </View>
        <View style={styles.sleepBars}>
          {SLEEP_DATA.map((val, i) => (
            <View key={i} style={styles.sleepBarWrap}>
              <View style={[styles.sleepBarContainer, { height: 80 }]}>
                <View
                  style={[
                    styles.sleepBar,
                    {
                      height: `${(val / 10) * 100}%`,
                      backgroundColor: i === 6 ? colors.cyan : colors.cyan + "55",
                    },
                    i === 6
                      ? (Platform.OS === "web"
                          ? ({ boxShadow: `0 0 8px ${colors.cyan}` } as any)
                          : { shadowColor: colors.cyan, shadowOpacity: 0.6, shadowRadius: 6 })
                      : {},
                  ]}
                />
              </View>
              <Text style={[styles.sleepDay, { color: i === 6 ? colors.cyan : colors.mutedForeground }]}>
                {SLEEP_DAYS[i]}
              </Text>
              <Text style={[styles.sleepVal, { color: colors.foreground }]}>{val}h</Text>
            </View>
          ))}
        </View>
        <View style={[styles.sleepQuality, { backgroundColor: colors.cyan + "12", borderColor: colors.cyan + "33" }]}>
          <MaterialCommunityIcons name="star-circle" size={16} color={colors.cyan} />
          <Text style={[styles.sleepQualityText, { color: colors.foreground }]}>
            Sleep quality: <Text style={{ color: colors.cyan, fontFamily: "Inter_700Bold" }}>Excellent (84/100)</Text>
          </Text>
        </View>
      </GlowCard>

      {/* Energy levels */}
      <GlowCard glowColor={colors.orange} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="flash" size={16} color={colors.orange} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>ENERGY & VITALS</Text>
        </View>
        <StatBar label="Active Minutes" value={72} max={120} color={colors.orange} unit="min" />
        <StatBar label="Hydration" value={6} max={8} color={colors.cyan} unit="cups" />
        <StatBar label="Stress Level" value={28} max={100} color={colors.green} unit="%" />
        <StatBar label="Recovery Score" value={84} max={100} color={colors.purple} unit="%" />
      </GlowCard>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={handleLogWorkout}
          style={[
            styles.actionBtn,
            {
              backgroundColor: loggedWorkout ? colors.green + "20" : colors.secondary,
              borderColor: loggedWorkout ? colors.green : colors.border,
              flex: 1,
            },
          ]}
        >
          <MaterialCommunityIcons name={loggedWorkout ? "check-circle" : "dumbbell"} size={20} color={loggedWorkout ? colors.green : colors.mutedForeground} />
          <Text style={[styles.actionBtnText, { color: loggedWorkout ? colors.green : colors.foreground }]}>
            {loggedWorkout ? "+150 XP" : "Log Workout"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleMeditation}
          style={[
            styles.actionBtn,
            {
              backgroundColor: loggedMeditation ? colors.purple + "20" : colors.secondary,
              borderColor: loggedMeditation ? colors.purple : colors.border,
              flex: 1,
            },
          ]}
        >
          <MaterialCommunityIcons name={loggedMeditation ? "check-circle" : "meditation"} size={20} color={loggedMeditation ? colors.purple : colors.mutedForeground} />
          <Text style={[styles.actionBtnText, { color: loggedMeditation ? colors.purple : colors.foreground }]}>
            {loggedMeditation ? "+75 XP" : "Meditate"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workouts */}
      <GlowCard glowColor={colors.purple} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="dumbbell" size={16} color={colors.purple} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>RECENT WORKOUTS</Text>
        </View>
        {WORKOUTS.map((w, i) => (
          <View
            key={i}
            style={[styles.workoutRow, { borderBottomColor: colors.border, borderBottomWidth: i < WORKOUTS.length - 1 ? 1 : 0 }]}
          >
            <View style={[styles.workoutIcon, { backgroundColor: colors.purple + "22" }]}>
              <MaterialCommunityIcons name={w.icon} size={18} color={colors.purple} />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={[styles.workoutType, { color: colors.foreground }]}>{w.type}</Text>
              <Text style={[styles.workoutMeta, { color: colors.mutedForeground }]}>{w.date} · {w.duration}</Text>
            </View>
            <View style={styles.workoutRight}>
              <Text style={[styles.workoutCal, { color: colors.orange }]}>{w.cal}</Text>
              <Text style={[styles.workoutCalLabel, { color: colors.mutedForeground }]}>kcal</Text>
            </View>
          </View>
        ))}
      </GlowCard>

      {/* Achievements */}
      <GlowCard glowColor={colors.warning} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="trophy" size={16} color={colors.warning} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>ACHIEVEMENTS</Text>
          <Text style={[styles.cardSub, { color: colors.warning }]}>3 / 6 earned</Text>
        </View>
        <View style={styles.achieveGrid}>
          {ACHIEVEMENTS.map((a, i) => (
            <View
              key={i}
              style={[
                styles.achieveItem,
                {
                  backgroundColor: a.earned ? a.color + "15" : colors.secondary,
                  borderColor: a.earned ? a.color + "44" : colors.border,
                  opacity: a.earned ? 1 : 0.45,
                },
              ]}
            >
              <MaterialCommunityIcons name={a.icon} size={22} color={a.earned ? a.color : colors.mutedForeground} />
              <Text style={[styles.achieveName, { color: colors.foreground }]}>{a.name}</Text>
              <Text style={[styles.achieveDesc, { color: colors.mutedForeground }]}>{a.desc}</Text>
              {a.earned && (
                <MaterialCommunityIcons name="check-decagram" size={14} color={a.color} style={styles.checkBadge} />
              )}
            </View>
          ))}
        </View>
      </GlowCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  screenSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  wearableBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  wearableDot: { width: 6, height: 6, borderRadius: 3 },
  wearableText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  ringsCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, gap: 20, alignItems: "center" },
  ringsTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2, alignSelf: "flex-start" },
  ringsRow: { flexDirection: "row", gap: 20, justifyContent: "center" },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2, flex: 1 },
  cardSub: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sleepBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  sleepBarWrap: { alignItems: "center", gap: 4 },
  sleepBarContainer: { justifyContent: "flex-end" },
  sleepBar: { width: 24, borderRadius: 4 },
  sleepDay: { fontSize: 10, fontFamily: "Inter_500Medium" },
  sleepVal: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  sleepQuality: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  sleepQualityText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  workoutRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  workoutIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  workoutInfo: { flex: 1 },
  workoutType: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  workoutMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  workoutRight: { alignItems: "flex-end" },
  workoutCal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  workoutCalLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  achieveGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achieveItem: { width: "47%", padding: 12, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 6, position: "relative" },
  achieveName: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  achieveDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  checkBadge: { position: "absolute", top: 8, right: 8 },
});
