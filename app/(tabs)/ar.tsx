import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowCard } from "@/components/GlowCard";
import { useColors } from "@/hooks/useColors";

const AR_OBJECTS = [
  { name: "Nexus Gate", type: "Portal", distance: "12m", rarity: "Epic", color: "#7c3aed" },
  { name: "HV Token", type: "Collectible", distance: "3m", rarity: "Legendary", color: "#ffb800" },
  { name: "Rival Node", type: "Combat Zone", distance: "28m", rarity: "Rare", color: "#ff006e" },
  { name: "Info Beacon", type: "Data Point", distance: "45m", rarity: "Common", color: "#00d4ff" },
];

const TIME_EVENTS = [
  { year: "2024", event: "HyperVerse Beta Launch", color: "#00d4ff" },
  { year: "2020", event: "Pandemic Urban Reset", color: "#ffb800" },
  { year: "2010", event: "Smart City Grid Installed", color: "#7c3aed" },
  { year: "1990", event: "District Founded", color: "#00ff9d" },
];

const GESTURES = [
  { name: "GRAB", icon: "hand-back-right" as const, desc: "Collect items", color: "#00d4ff" },
  { name: "THROW", icon: "gesture-swipe-right" as const, desc: "Launch objects", color: "#ff006e" },
  { name: "PINCH", icon: "arrow-expand-all" as const, desc: "Scale scene", color: "#7c3aed" },
  { name: "SCAN", icon: "line-scan" as const, desc: "Analyze world", color: "#00ff9d" },
];

const LOD_LEVELS = ["Ultra", "High", "Medium", "Low"];

function RadarPing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;
  const delay = useRef(Math.random() * 2000).current;
  const nd = Platform.OS !== "web";

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 2500, useNativeDriver: nd }),
          Animated.timing(opacity, { toValue: 0, duration: 2500, useNativeDriver: nd }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0, duration: 0, useNativeDriver: nd }),
          Animated.timing(opacity, { toValue: 0.8, duration: 0, useNativeDriver: nd }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: 999,
          borderWidth: 1,
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

export default function ARScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeGesture, setActiveGesture] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [timeTravel, setTimeTravel] = useState(false);
  const [selectedTimeIdx, setSelectedTimeIdx] = useState(0);
  const [lodLevel, setLodLevel] = useState(0);
  const [geoFencing, setGeoFencing] = useState(true);
  const scanRotate = useRef(new Animated.Value(0)).current;
  const timeTravelGlow = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (timeTravel) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timeTravelGlow, { toValue: 1, duration: 1500, useNativeDriver: false }),
          Animated.timing(timeTravelGlow, { toValue: 0, duration: 1500, useNativeDriver: false }),
        ])
      ).start();
    } else {
      timeTravelGlow.stopAnimation();
      timeTravelGlow.setValue(0);
    }
  }, [timeTravel]);

  const handleGesture = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActiveGesture(name);
    setTimeout(() => setActiveGesture(null), 1000);
  };

  const startScan = () => {
    if (scanning) return;
    setScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.timing(scanRotate, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== "web",
    }).start(() => {
      setScanning(false);
      scanRotate.setValue(0);
    });
  };

  const toggleTimeTravel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeTravel((v) => !v);
  };

  const spin = scanRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const borderGlow = timeTravelGlow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] });
  const radarColor = timeTravel ? colors.warning : colors.cyan;

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
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>AR OVERLAY</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>City-scale spatial computing</Text>
        </View>
        <TouchableOpacity
          onPress={toggleTimeTravel}
          style={[
            styles.timeTravelBtn,
            {
              backgroundColor: timeTravel ? colors.warning + "22" : colors.secondary,
              borderColor: timeTravel ? colors.warning : colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="clock-time-eight" size={16} color={timeTravel ? colors.warning : colors.mutedForeground} />
          <Text style={[styles.timeTravelText, { color: timeTravel ? colors.warning : colors.mutedForeground }]}>
            {timeTravel ? "LIVE" : "TIME"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Radar */}
      <GlowCard glowColor={radarColor} style={styles.radarCard}>
        {timeTravel && (
          <View style={[styles.timeTravelBanner, { backgroundColor: colors.warning + "18", borderColor: colors.warning + "44" }]}>
            <MaterialCommunityIcons name="clock-time-eight" size={14} color={colors.warning} />
            <Text style={[styles.timeTravelLabel, { color: colors.warning }]}>
              TIME TRAVEL MODE: {TIME_EVENTS[selectedTimeIdx].year}
            </Text>
          </View>
        )}

        <View style={styles.radar}>
          <RadarPing color={radarColor} />
          <RadarPing color={radarColor} />
          <RadarPing color={radarColor} />
          <View style={[styles.crossH, { backgroundColor: radarColor + "33" }]} />
          <View style={[styles.crossV, { backgroundColor: radarColor + "33" }]} />
          <View style={[styles.radarCenter, { backgroundColor: radarColor }]} />

          {AR_OBJECTS.map((obj, i) => {
            const angles = [45, 130, 220, 310];
            const radii = [55, 35, 70, 45];
            const angle = (angles[i] * Math.PI) / 180;
            const r = radii[i];
            return (
              <View
                key={i}
                style={[
                  styles.radarDot,
                  {
                    backgroundColor: timeTravel ? colors.warning : obj.color,
                    left: 95 + r * Math.cos(angle) - 5,
                    top: 95 + r * Math.sin(angle) - 5,
                  },
                  Platform.OS === "web"
                    ? ({ boxShadow: `0 0 8px ${timeTravel ? colors.warning : obj.color}` } as any)
                    : { shadowColor: timeTravel ? colors.warning : obj.color, shadowOpacity: 0.9, shadowRadius: 6 },
                ]}
              />
            );
          })}

          <Animated.View
            style={[styles.scanLine, { backgroundColor: radarColor + "66", transform: [{ rotate: spin }] }]}
          />
        </View>

        <TouchableOpacity
          onPress={startScan}
          style={[styles.scanBtn, { backgroundColor: scanning ? radarColor + "22" : colors.secondary, borderColor: radarColor }]}
        >
          <MaterialCommunityIcons name="line-scan" size={18} color={scanning ? radarColor : colors.mutedForeground} />
          <Text style={[styles.scanBtnText, { color: scanning ? radarColor : colors.mutedForeground }]}>
            {scanning ? "SCANNING..." : "SCAN AREA"}
          </Text>
        </TouchableOpacity>
      </GlowCard>

      {/* Time Travel timeline */}
      {timeTravel && (
        <GlowCard glowColor={colors.warning} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="timeline-clock" size={16} color={colors.warning} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>TIME TRAVEL AR</Text>
          </View>
          {TIME_EVENTS.map((ev, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTimeIdx(i);
              }}
            >
              <View
                style={[
                  styles.timelineRow,
                  {
                    backgroundColor: i === selectedTimeIdx ? ev.color + "15" : "transparent",
                    borderColor: i === selectedTimeIdx ? ev.color + "44" : "transparent",
                  },
                ]}
              >
                <View style={[styles.timelineYear, { backgroundColor: ev.color + "22" }]}>
                  <Text style={[styles.timelineYearText, { color: ev.color }]}>{ev.year}</Text>
                </View>
                <Text style={[styles.timelineEvent, { color: colors.foreground }]}>{ev.event}</Text>
                {i === selectedTimeIdx && (
                  <MaterialCommunityIcons name="check-circle" size={16} color={ev.color} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </GlowCard>
      )}

      {/* LOD & Geo-fencing controls */}
      <GlowCard glowColor={colors.cyan} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="tune" size={16} color={colors.cyan} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>PERFORMANCE</Text>
        </View>
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: colors.mutedForeground }]}>LOD Level</Text>
          <View style={styles.lodButtons}>
            {LOD_LEVELS.map((l, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLodLevel(i); }}
                style={[
                  styles.lodBtn,
                  {
                    backgroundColor: lodLevel === i ? colors.cyan + "22" : colors.secondary,
                    borderColor: lodLevel === i ? colors.cyan : colors.border,
                  },
                ]}
              >
                <Text style={[styles.lodBtnText, { color: lodLevel === i ? colors.cyan : colors.mutedForeground }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGeoFencing(v => !v); }}
          style={styles.toggleRow}
        >
          <View>
            <Text style={[styles.controlLabel, { color: colors.mutedForeground }]}>Geo-Fencing</Text>
            <Text style={[styles.controlSub, { color: colors.mutedForeground }]}>Stream only nearby AR objects</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: geoFencing ? colors.cyan + "22" : colors.muted, borderColor: geoFencing ? colors.cyan : colors.border }]}>
            <View style={[styles.toggleKnob, { backgroundColor: geoFencing ? colors.cyan : colors.mutedForeground, marginLeft: geoFencing ? 18 : 2 }]} />
          </View>
        </TouchableOpacity>
      </GlowCard>

      {/* Detected objects */}
      <GlowCard glowColor={colors.purple} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="cube-scan" size={16} color={colors.purple} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>DETECTED OBJECTS</Text>
          <Text style={[styles.objCount, { color: colors.purple }]}>{AR_OBJECTS.length}</Text>
        </View>
        {AR_OBJECTS.map((obj, i) => (
          <TouchableOpacity key={i} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <View style={[styles.objRow, { borderBottomColor: colors.border, borderBottomWidth: i < AR_OBJECTS.length - 1 ? 1 : 0 }]}>
              <View style={[styles.objDot, { backgroundColor: obj.color }, Platform.OS === "web" ? ({ boxShadow: `0 0 6px ${obj.color}` } as any) : { shadowColor: obj.color, shadowOpacity: 0.8, shadowRadius: 4 }]} />
              <View style={styles.objInfo}>
                <Text style={[styles.objName, { color: colors.foreground }]}>{obj.name}</Text>
                <Text style={[styles.objType, { color: colors.mutedForeground }]}>{obj.type}</Text>
              </View>
              <View style={styles.objRight}>
                <Text style={[styles.objDist, { color: obj.color }]}>{obj.distance}</Text>
                <View style={[styles.rarityBadge, { backgroundColor: obj.color + "22" }]}>
                  <Text style={[styles.rarityText, { color: obj.color }]}>{obj.rarity}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </GlowCard>

      {/* Gestures */}
      <GlowCard glowColor={colors.orange} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="gesture-tap" size={16} color={colors.orange} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>GESTURE CONTROLS</Text>
        </View>
        <View style={styles.gestureGrid}>
          {GESTURES.map((g, i) => (
            <TouchableOpacity key={i} onPress={() => handleGesture(g.name)}>
              <View
                style={[
                  styles.gestureBtn,
                  {
                    backgroundColor: activeGesture === g.name ? g.color + "22" : colors.secondary,
                    borderColor: activeGesture === g.name ? g.color : colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons name={g.icon} size={24} color={activeGesture === g.name ? g.color : colors.mutedForeground} />
                <Text style={[styles.gestureName, { color: colors.foreground }]}>{g.name}</Text>
                <Text style={[styles.gestureDesc, { color: colors.mutedForeground }]}>{g.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </GlowCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  screenSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  timeTravelBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  timeTravelText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  radarCard: { marginBottom: 16, alignItems: "center", gap: 12 },
  timeTravelBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, alignSelf: "stretch" },
  timeTravelLabel: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  radar: { width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: "#00d4ff33", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  crossH: { position: "absolute", height: 1, width: "100%" },
  crossV: { position: "absolute", width: 1, height: "100%" },
  radarCenter: { width: 8, height: 8, borderRadius: 4 },
  radarDot: { position: "absolute", width: 10, height: 10, borderRadius: 5 },
  scanLine: { position: "absolute", width: "50%", height: 2, left: "50%", top: "50%", transformOrigin: "0% 50%" },
  scanBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  scanBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2, flex: 1 },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  timelineYear: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  timelineYearText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  timelineEvent: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  controlRow: { marginBottom: 14 },
  controlLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  controlSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  lodButtons: { flexDirection: "row", gap: 8 },
  lodBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  lodBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  toggle: { width: 44, height: 26, borderRadius: 13, borderWidth: 1, justifyContent: "center" },
  toggleKnob: { width: 20, height: 20, borderRadius: 10 },
  objCount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  objRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  objDot: { width: 10, height: 10, borderRadius: 5 },
  objInfo: { flex: 1 },
  objName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  objType: { fontSize: 12, fontFamily: "Inter_400Regular" },
  objRight: { alignItems: "flex-end", gap: 4 },
  objDist: { fontSize: 13, fontFamily: "Inter_700Bold" },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  rarityText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  gestureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gestureBtn: { width: "47%", padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 8 },
  gestureName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  gestureDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
