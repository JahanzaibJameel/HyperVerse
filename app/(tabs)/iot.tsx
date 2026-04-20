import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlowCard } from "@/components/GlowCard";
import { IoTDevice } from "@/components/IoTDevice";
import { CircularProgress } from "@/components/CircularProgress";
import { useColors } from "@/hooks/useColors";

const DEVICES = [
  { name: "Thermostat", icon: "thermometer" as const, status: "auto", value: "72°F", active: true, color: "#ff6b00" },
  { name: "Lights", icon: "lightbulb" as const, status: "on", value: "80%", active: true, color: "#ffb800" },
  { name: "Security", icon: "shield-check" as const, status: "armed", value: "Active", active: true, color: "#00ff9d" },
  { name: "Coffee", icon: "coffee" as const, status: "scheduled", value: "6:45AM", active: true, color: "#7c3aed" },
  { name: "A/C", icon: "air-conditioner" as const, status: "off", value: "68°F", active: false, color: "#00d4ff" },
  { name: "Speaker", icon: "speaker" as const, status: "standby", value: "vol 40", active: false, color: "#ff006e" },
];

const AUTOMATIONS = [
  { name: "Morning Routine", trigger: "6:30 AM", actions: "Lights → Coffee → Heat", icon: "weather-sunny" as const, active: true, color: "#ffb800" },
  { name: "Arrive Home", trigger: "Geo-fence 500m", actions: "Unlock → AC → Music", icon: "home-circle" as const, active: true, color: "#00d4ff" },
  { name: "Sleep Mode", trigger: "10:30 PM", actions: "Dim → Lock → Cool", icon: "weather-night" as const, active: false, color: "#7c3aed" },
  { name: "Work Focus", trigger: "9:00 AM weekdays", actions: "DND → Desk lamp → Cool", icon: "laptop" as const, active: true, color: "#00ff9d" },
];

const MQTT_EVENTS = [
  { topic: "hvac/status", value: "72°F", time: "2s ago", color: "#ff6b00" },
  { topic: "security/door", value: "Locked", time: "1m ago", color: "#00ff9d" },
  { topic: "energy/grid", value: "3.2 kWh", time: "5m ago", color: "#ffb800" },
  { topic: "air/quality", value: "AQI 18", time: "10m ago", color: "#00d4ff" },
];

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          transform: [{ scale: pulse }],
        },
        Platform.OS === "web"
          ? ({ boxShadow: `0 0 6px ${color}` } as any)
          : { shadowColor: color, shadowOpacity: 0.8, shadowRadius: 4 },
      ]}
    />
  );
}

export default function IoTScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [activeDevices, setActiveDevices] = useState(4);
  const [energyMode, setEnergyMode] = useState<"normal" | "eco" | "turbo">("eco");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const toggleAutomation = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAutomations((prev) => prev.map((a, i) => (i === idx ? { ...a, active: !a.active } : a)));
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
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>IoT HUB</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>Smart environment control</Text>
        </View>
        <View style={[styles.onlineStatus, { backgroundColor: colors.green + "12", borderColor: colors.green + "44" }]}>
          <PulsingDot color={colors.green} />
          <Text style={[styles.onlineText, { color: colors.green }]}>8 ONLINE</Text>
        </View>
      </View>

      {/* Environment overview */}
      <LinearGradient
        colors={["#081420", "#0a1628", "#0d1a2e"]}
        style={[styles.envCard, { borderColor: colors.cyan + "33" }]}
      >
        <Text style={[styles.envTitle, { color: colors.mutedForeground }]}>ENVIRONMENT</Text>
        <View style={styles.envRings}>
          <CircularProgress value={72} max={100} size={85} color={colors.orange} label="TEMP" unit="°F" />
          <CircularProgress value={45} max={100} size={85} color={colors.cyan} label="HUM" unit="%" />
          <CircularProgress value={92} max={100} size={85} color={colors.green} label="AIR" unit="AQI" />
          <CircularProgress value={68} max={100} size={85} color={colors.warning} label="POWER" unit="%" />
        </View>

        {/* Energy mode */}
        <View style={styles.energyRow}>
          <Text style={[styles.energyLabel, { color: colors.mutedForeground }]}>ENERGY MODE</Text>
          <View style={styles.energyBtns}>
            {(["eco", "normal", "turbo"] as const).map((m) => {
              const modeColors = { eco: colors.green, normal: colors.cyan, turbo: colors.orange };
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEnergyMode(m); }}
                  style={[styles.energyBtn, { backgroundColor: energyMode === m ? modeColors[m] + "22" : "transparent", borderColor: energyMode === m ? modeColors[m] : colors.border }]}
                >
                  <Text style={[styles.energyBtnText, { color: energyMode === m ? modeColors[m] : colors.mutedForeground }]}>
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </LinearGradient>

      {/* Devices */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DEVICES</Text>
      <FlatList
        data={DEVICES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        style={styles.deviceList}
        renderItem={({ item }) => <IoTDevice {...item} />}
      />

      {/* MQTT Stream */}
      <GlowCard glowColor={colors.purple} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="antenna" size={16} color={colors.purple} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>MQTT STREAM</Text>
          <View style={[styles.liveTag, { backgroundColor: colors.green + "12", borderColor: colors.green + "33" }]}>
            <PulsingDot color={colors.green} />
            <Text style={[styles.liveText, { color: colors.green }]}>LIVE</Text>
          </View>
        </View>
        {MQTT_EVENTS.map((ev, i) => (
          <View
            key={i}
            style={[styles.mqttRow, { borderBottomColor: colors.border, borderBottomWidth: i < MQTT_EVENTS.length - 1 ? 1 : 0 }]}
          >
            <View style={[styles.mqttDot, { backgroundColor: ev.color }, Platform.OS === "web" ? ({ boxShadow: `0 0 6px ${ev.color}` } as any) : { shadowColor: ev.color, shadowOpacity: 0.8, shadowRadius: 4 }]} />
            <Text style={[styles.mqttTopic, { color: colors.cyan }]}>{ev.topic}</Text>
            <Text style={[styles.mqttValue, { color: colors.foreground }]}>{ev.value}</Text>
            <Text style={[styles.mqttTime, { color: colors.mutedForeground }]}>{ev.time}</Text>
          </View>
        ))}
      </GlowCard>

      {/* AI Predictions */}
      <GlowCard glowColor={colors.orange} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="brain" size={16} color={colors.orange} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>AI PREDICTIONS</Text>
        </View>
        {[
          { text: "You'll arrive home in ~22 min — pre-heating now", icon: "home-circle" as const, color: colors.orange, action: "Triggered" },
          { text: "Weather drop tonight → adjusting heating schedule", icon: "weather-snowy" as const, color: colors.cyan, action: "Scheduled" },
          { text: "High energy peak in 3h — offloading to battery", icon: "lightning-bolt" as const, color: colors.warning, action: "Optimizing" },
          { text: "Sedentary alert: suggest 10min break & stretch", icon: "human" as const, color: colors.green, action: "Notified" },
        ].map((p, i) => (
          <View key={i} style={[styles.predRow, { borderBottomColor: colors.border, borderBottomWidth: i < 3 ? 1 : 0 }]}>
            <View style={[styles.predIcon, { backgroundColor: p.color + "20" }]}>
              <MaterialCommunityIcons name={p.icon} size={16} color={p.color} />
            </View>
            <Text style={[styles.predText, { color: colors.foreground }]}>{p.text}</Text>
            <View style={[styles.predAction, { backgroundColor: p.color + "18" }]}>
              <Text style={[styles.predActionText, { color: p.color }]}>{p.action}</Text>
            </View>
          </View>
        ))}
      </GlowCard>

      {/* Automations */}
      <GlowCard glowColor={colors.cyan} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="robot" size={16} color={colors.cyan} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>AUTOMATIONS</Text>
          <Text style={[styles.activeCount, { color: colors.cyan }]}>{automations.filter(a => a.active).length}/{automations.length}</Text>
        </View>
        {automations.map((a, i) => (
          <TouchableOpacity key={i} onPress={() => toggleAutomation(i)}>
            <View
              style={[
                styles.autoRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: i < automations.length - 1 ? 1 : 0,
                  opacity: a.active ? 1 : 0.5,
                  backgroundColor: a.active ? a.color + "08" : "transparent",
                  borderRadius: 10,
                },
              ]}
            >
              <View style={[styles.autoIcon, { backgroundColor: (a.active ? a.color : colors.muted) + "22" }]}>
                <MaterialCommunityIcons name={a.icon} size={20} color={a.active ? a.color : colors.mutedForeground} />
              </View>
              <View style={styles.autoInfo}>
                <Text style={[styles.autoName, { color: colors.foreground }]}>{a.name}</Text>
                <Text style={[styles.autoMeta, { color: colors.mutedForeground }]}>{a.trigger}</Text>
                <Text style={[styles.autoActions, { color: a.active ? a.color : colors.mutedForeground }]}>{a.actions}</Text>
              </View>
              <View style={[styles.toggle, { backgroundColor: a.active ? colors.green + "22" : colors.muted, borderColor: a.active ? colors.green : colors.border }]}>
                <View style={[styles.toggleKnob, { backgroundColor: a.active ? colors.green : colors.mutedForeground, marginLeft: a.active ? 18 : 2 }]} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </GlowCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  screenSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  onlineStatus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  onlineText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  envCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, gap: 16 },
  envTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  envRings: { flexDirection: "row", justifyContent: "space-between" },
  energyRow: { gap: 10 },
  energyLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  energyBtns: { flexDirection: "row", gap: 8 },
  energyBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  energyBtnText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 12 },
  deviceList: { marginBottom: 16 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2, flex: 1 },
  liveTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  liveText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  activeCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  mqttRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  mqttDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  mqttTopic: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  mqttValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  mqttTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: 8 },
  predRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  predIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  predText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  predAction: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  predActionText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  autoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 6, marginBottom: 2 },
  autoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  autoInfo: { flex: 1 },
  autoName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  autoMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  autoActions: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: 13, borderWidth: 1, justifyContent: "center" },
  toggleKnob: { width: 20, height: 20, borderRadius: 10 },
});
