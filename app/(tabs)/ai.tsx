import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowCard } from "@/components/GlowCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const QUICK_PROMPTS = [
  "Optimize my morning routine",
  "Analyze my finances",
  "Plan my workout",
  "Check IoT status",
  "Virtual Twin report",
  "AR city update",
];

const MEMORY_ITEMS = [
  { key: "Preference", value: "Morning workouts before 8am", icon: "brain" as const },
  { key: "Goal", value: "Reach Level 10 by end of month", icon: "flag" as const },
  { key: "Pattern", value: "Productivity peaks 9-11am daily", icon: "chart-line" as const },
  { key: "Context", value: "Working on crypto portfolio", icon: "ethereum" as const },
];

const VIRTUAL_TWIN_DATA = [
  { label: "Physical Sync", value: "94%", color: "#00ff9d" },
  { label: "Finance Twin", value: "88%", color: "#ffb800" },
  { label: "Social Twin", value: "71%", color: "#7c3aed" },
  { label: "AR Presence", value: "82%", color: "#00d4ff" },
];

const AI_RESPONSES: Record<string, string> = {
  "Optimize my morning routine":
    "Neural analysis complete. Based on your 7.4h sleep data and cortisol peak window (7-9 AM): \n\n• 6:30 — Wake + cold exposure (2 min)\n• 6:45 — Meditation (10 min) +75 XP\n• 7:00 — HIIT training (25 min) +150 XP\n• 7:30 — High-protein breakfast\n• 8:00 — Deep focus block\n\nThis sequence optimizes for your biometric patterns. Estimated daily XP gain: +320.",
  "Analyze my finances":
    "Financial quantum scan complete:\n\n• Net worth: $24,680 (+13% MoM)\n• Savings rate: 62% — exceptional\n• Crypto portfolio: outperforming S&P by 4.2%\n• 3 unused subscriptions found (-$57/mo)\n\nRecommendation: Allocate 15% of next paycheck to index funds. 90-day projection: +$8,400 at current trajectory.",
  "Plan my workout":
    "Recovery score: 84/100. Today is ideal for high intensity.\n\nSuggested session:\n• Warm-up (5 min)\n• Chest + Triceps compound lifts (20 min)\n• HIIT intervals × 8 rounds (15 min)\n• Cool-down stretch (5 min)\n\nEst. burn: 520 kcal | +200 XP | Advances 'Iron Will' NFT by 4%",
  "Check IoT status":
    "Smart environment scan:\n\n• 8/8 devices online\n• Thermostat: 72°F (auto-optimized)\n• Air quality: Excellent (AQI 18)\n• Energy usage: 12% below baseline\n• Coffee pre-programmed: 6:45 AM\n• Security: Armed, all zones clear\n\nPrediction: Pre-heating home now for arrival in 22 min.",
  "Virtual Twin report":
    "Virtual Twin simulation complete:\n\n• Physical sync: 94% accuracy\n• Finance twin divergence: -2.3% (minor)\n• Social graph match: 71%\n• AR presence calibrated\n\nLife simulation for next 30 days predicts:\n• XP gain: +12,400\n• Net worth: +$3,200\n• Health score improvement: +8 points\n\nOptimization opportunities detected: 3",
  "AR city update":
    "AR city mesh status:\n\n• 4 objects in your proximity radius\n• Legendary HV Token at 3m — collect now!\n• Active raid: Nexus Gate (12m) — 24 participants\n• Your global rank: #3 (↑ from #5)\n• Seasonal challenge: 68% complete\n\nTime-sensitive: Token expires in 2h 14m.",
};

export default function AIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { aiMessages, addMessage, clearMessages, user, health, finance } = useApp();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [tab, setTab] = useState<"chat" | "memory" | "twin">("chat");
  const [voiceActive, setVoiceActive] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      content: text.trim(),
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput("");
    setIsTyping(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    const response =
      AI_RESPONSES[text.trim()] ||
      `Neural processing complete. I've analyzed your biometric context (HR: ${health.heartRate}bpm, Sleep: ${health.sleep}h) alongside your financial position ($${finance.balance.toLocaleString()} net worth) and AR environment. \n\nFor "${text.trim()}" — I recommend focusing on your morning routine optimization and increasing daily XP acquisition. Want me to generate a detailed action plan?`;

    addMessage({
      id: (Date.now() + 1).toString(),
      role: "assistant" as const,
      content: response,
      timestamp: Date.now(),
    });
    setIsTyping(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setVoiceActive((v) => !v);
    if (!voiceActive) {
      setTimeout(() => {
        setVoiceActive(false);
        sendMessage("Optimize my morning routine");
      }, 2500);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.purple + "22", borderColor: colors.purple }]}>
            <MaterialCommunityIcons name="brain" size={18} color={colors.purple} />
          </View>
          <View>
            <Text style={[styles.aiName, { color: colors.foreground }]}>HyperVerse AI</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
              <Text style={[styles.statusText, { color: colors.green }]}>Contextual memory active</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={clearMessages}>
          <MaterialCommunityIcons name="refresh" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {([["chat", "Chat", "message-outline"], ["memory", "Memory", "brain"], ["twin", "Virtual Twin", "account-box-outline"]] as const).map(([t, label, icon]) => (
          <TouchableOpacity
            key={t}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
            style={[styles.tab, { borderBottomColor: tab === t ? colors.purple : "transparent" }]}
          >
            <MaterialCommunityIcons name={icon} size={16} color={tab === t ? colors.purple : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === t ? colors.purple : colors.mutedForeground }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "chat" && (
        <>
          <FlatList
            ref={flatRef}
            data={[...aiMessages].reverse()}
            inverted
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isTyping ? (
                <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.purple + "44" }]}>
                  <Text style={[styles.typingText, { color: colors.mutedForeground }]}>Processing through neural mesh...</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === "user" ? [styles.userBubble, { backgroundColor: colors.cyan + "20", borderColor: colors.cyan + "44" }] : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.purple + "44" }]]}>
                {item.role === "assistant" && <MaterialCommunityIcons name="brain" size={12} color={colors.purple} style={styles.msgIcon} />}
                <Text style={[styles.msgText, { color: colors.foreground }]}>{item.content}</Text>
              </View>
            )}
          />

          <FlatList
            data={QUICK_PROMPTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickList}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => sendMessage(item)} style={[styles.quickChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.quickText, { color: colors.mutedForeground }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
            <TouchableOpacity
              onPress={handleVoice}
              style={[styles.voiceBtn, { backgroundColor: voiceActive ? colors.pink + "22" : colors.secondary, borderColor: voiceActive ? colors.pink : colors.border }]}
            >
              <MaterialCommunityIcons name={voiceActive ? "microphone" : "microphone-outline"} size={20} color={voiceActive ? colors.pink : colors.mutedForeground} />
            </TouchableOpacity>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask the neural mesh..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              style={[styles.sendBtn, { backgroundColor: input.trim() && !isTyping ? colors.purple : colors.muted }]}
            >
              <Ionicons name="send" size={16} color={input.trim() && !isTyping ? "#fff" : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {tab === "memory" && (
        <ScrollView contentContainerStyle={styles.memoryContainer} showsVerticalScrollIndicator={false}>
          <Text style={[styles.memoryTitle, { color: colors.foreground }]}>CONTEXTUAL MEMORY</Text>
          <Text style={[styles.memorySub, { color: colors.mutedForeground }]}>AI learns from your patterns over time</Text>

          {MEMORY_ITEMS.map((m, i) => (
            <GlowCard key={i} glowColor={colors.purple} style={styles.memoryCard}>
              <View style={styles.memoryRow}>
                <View style={[styles.memoryIcon, { backgroundColor: colors.purple + "22" }]}>
                  <MaterialCommunityIcons name={m.icon} size={18} color={colors.purple} />
                </View>
                <View style={styles.memoryInfo}>
                  <Text style={[styles.memoryKey, { color: colors.mutedForeground }]}>{m.key}</Text>
                  <Text style={[styles.memoryValue, { color: colors.foreground }]}>{m.value}</Text>
                </View>
              </View>
            </GlowCard>
          ))}

          <GlowCard glowColor={colors.cyan} style={styles.memoryCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={16} color={colors.cyan} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>LEARNING STATS</Text>
            </View>
            {[
              { label: "Interactions analyzed", value: "1,247" },
              { label: "Patterns detected", value: "38" },
              { label: "Personalization score", value: "91%" },
              { label: "Prediction accuracy", value: "84%" },
            ].map((s, i) => (
              <View key={i} style={[styles.statRow, { borderBottomColor: colors.border, borderBottomWidth: i < 3 ? 1 : 0 }]}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                <Text style={[styles.statVal, { color: colors.cyan }]}>{s.value}</Text>
              </View>
            ))}
          </GlowCard>
        </ScrollView>
      )}

      {tab === "twin" && (
        <ScrollView contentContainerStyle={styles.memoryContainer} showsVerticalScrollIndicator={false}>
          <Text style={[styles.memoryTitle, { color: colors.foreground }]}>VIRTUAL TWIN</Text>
          <Text style={[styles.memorySub, { color: colors.mutedForeground }]}>Digital simulation of your life</Text>

          <GlowCard glowColor={colors.cyan} style={styles.memoryCard}>
            <View style={styles.twinHeader}>
              <View style={[styles.twinAvatar, { backgroundColor: colors.cyan + "22", borderColor: colors.cyan }]}>
                <MaterialCommunityIcons name="account-circle" size={40} color={colors.cyan} />
              </View>
              <View>
                <Text style={[styles.twinName, { color: colors.foreground }]}>{user.name}</Text>
                <Text style={[styles.twinSub, { color: colors.cyan }]}>Digital Twin v{user.level}.0</Text>
                <Text style={[styles.twinSync, { color: colors.mutedForeground }]}>Last synced: 2 min ago</Text>
              </View>
            </View>

            <View style={styles.twinStats}>
              {VIRTUAL_TWIN_DATA.map((d, i) => (
                <View key={i} style={styles.twinStat}>
                  <Text style={[styles.twinStatVal, { color: d.color }]}>{d.value}</Text>
                  <Text style={[styles.twinStatLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
                </View>
              ))}
            </View>
          </GlowCard>

          <GlowCard glowColor={colors.purple} style={styles.memoryCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="crystal-ball" size={16} color={colors.purple} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>30-DAY SIMULATION</Text>
            </View>
            {[
              { label: "XP gain projected", value: "+12,400 XP", color: colors.cyan },
              { label: "Net worth change", value: "+$3,200", color: colors.green },
              { label: "Health score", value: "+8 pts", color: colors.green },
              { label: "NFTs to evolve", value: "2 pending", color: colors.warning },
              { label: "AR rank prediction", value: "#1 possible", color: colors.purple },
            ].map((s, i) => (
              <View key={i} style={[styles.statRow, { borderBottomColor: colors.border, borderBottomWidth: i < 4 ? 1 : 0 }]}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              </View>
            ))}
          </GlowCard>

          <GlowCard glowColor={colors.warning} style={styles.memoryCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.warning} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>OPTIMIZATION OPS</Text>
            </View>
            {[
              { text: "Sleep 30 min earlier → +14 XP/day", icon: "sleep" as const, color: colors.cyan },
              { text: "Add 2k steps/day → reach goal in 4d", icon: "shoe-sneaker" as const, color: colors.green },
              { text: "Stake 500 tokens → +8% APY", icon: "safe" as const, color: colors.warning },
            ].map((op, i) => (
              <View key={i} style={[styles.opRow, { borderBottomColor: colors.border, borderBottomWidth: i < 2 ? 1 : 0 }]}>
                <View style={[styles.opIcon, { backgroundColor: op.color + "20" }]}>
                  <MaterialCommunityIcons name={op.icon} size={16} color={op.color} />
                </View>
                <Text style={[styles.opText, { color: colors.foreground }]}>{op.text}</Text>
              </View>
            ))}
          </GlowCard>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  aiName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderBottomWidth: 2 },
  tabText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  bubble: { borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, maxWidth: "92%" },
  userBubble: { alignSelf: "flex-end", borderTopRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderTopLeftRadius: 4 },
  msgIcon: { marginBottom: 4 },
  msgText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  typingText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  quickList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: "flex-start" },
  quickChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start" },
  quickText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  voiceBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 40 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  memoryContainer: { padding: 16, paddingBottom: 100 },
  memoryTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  memorySub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16 },
  memoryCard: { marginBottom: 14 },
  memoryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  memoryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  memoryInfo: { flex: 1 },
  memoryKey: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 1, marginBottom: 2 },
  memoryValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2, flex: 1 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  twinHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  twinAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  twinName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  twinSub: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  twinSync: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  twinStats: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  twinStat: { alignItems: "center", minWidth: 80 },
  twinStatVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  twinStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 2 },
  opRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  opIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  opText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
});
