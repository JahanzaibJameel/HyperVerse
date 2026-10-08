import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
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
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowCard } from "@/components/GlowCard";
import { useAuthStore } from "@/lib/stores/authStore";
import { AIRepository } from "@/lib/database/repositories/AIRepository";
import { TaskRepository } from "@/lib/database/repositories/TaskRepository";
import { HabitRepository } from "@/lib/database/repositories/HabitRepository";
import { HealthRepository } from "@/lib/database/repositories/HealthRepository";
import { FinanceRepository } from "@/lib/database/repositories/FinanceRepository";
import AIService from "@/lib/ai/AIService";
import { useColors } from "@/hooks/useColors";
import type { AIMessage } from "@/lib/database/models/AIMessage";

const SESSION_ID = "default";

/** Prompts chosen to match the intents the insight engine actually answers. */
const QUICK_PROMPTS = [
  "How am I doing?",
  "Analyse my finances",
  "What should I do today?",
  "How did I sleep?",
  "Which tasks are overdue?",
  "How are my habits?",
];

export default function AIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [tab, setTab] = useState<"chat" | "memory" | "twin">("chat");
  const [voiceActive, setVoiceActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [contextStats, setContextStats] = useState({
    healthRecords: 0,
    transactions: 0,
    goals: 0,
    openTasks: 0,
    overdueTasks: 0,
    habitCount: 0,
    income: 0,
    expenses: 0,
    steps: 0,
    stepsGoal: 0,
    sleep: 0,
  });
  const flatRef = useRef<FlatList>(null);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadContextStats = useCallback(async () => {
    if (!user?.dbId) return;
    try {
      const [metrics, finance, goals, tasks, habits] = await Promise.all([
        HealthRepository.findLatest(user.dbId),
        FinanceRepository.summary(user.dbId),
        FinanceRepository.findActiveGoals(user.dbId),
        TaskRepository.findByUser(user.dbId),
        HabitRepository.findActive(user.dbId),
      ]);
      const open = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');
      setContextStats({
        healthRecords: metrics ? 1 : 0,
        transactions: finance.income > 0 || finance.expenses > 0 ? 1 : 0,
        goals: goals.length,
        openTasks: open.length,
        overdueTasks: open.filter((t) => t.isOverdue).length,
        habitCount: habits.length,
        income: finance.income,
        expenses: finance.expenses,
        steps: metrics?.steps ?? 0,
        stepsGoal: metrics?.stepsGoal ?? 0,
        sleep: metrics?.sleepHours ?? 0,
      });
    } catch (error) {
      console.error("Failed to load AI context stats", error);
    }
  }, [user?.dbId]);

  /** Context rows for the Data Context tab, built from real records. */
  const memoryItems = (() => {
    const items: { key: string; value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [];

    if (contextStats.openTasks > 0) {
      items.push({
        key: "Open tasks",
        value:
          contextStats.overdueTasks > 0
            ? `${contextStats.openTasks} open, ${contextStats.overdueTasks} overdue`
            : `${contextStats.openTasks} open, none overdue`,
        icon: "clipboard-list-outline",
      });
    }
    if (contextStats.habitCount > 0) {
      items.push({
        key: "Habits tracked",
        value: `${contextStats.habitCount} active`,
        icon: "target",
      });
    }
    if (contextStats.healthRecords > 0) {
      items.push({
        key: "Latest health",
        value: `${contextStats.steps.toLocaleString()} steps, ${contextStats.sleep.toFixed(1)}h sleep`,
        icon: "heart-pulse",
      });
    }
    if (contextStats.income > 0 || contextStats.expenses > 0) {
      items.push({
        key: "Cash flow",
        value: `$${contextStats.income.toLocaleString()} in, $${contextStats.expenses.toLocaleString()} out`,
        icon: "cash-multiple",
      });
    }
    if (contextStats.goals > 0) {
      items.push({
        key: "Savings goals",
        value: `${contextStats.goals} active`,
        icon: "flag-outline",
      });
    }
    if (user?.streak) {
      items.push({ key: "Streak", value: `${user.streak} days`, icon: "fire" });
    }

    return items;
  })();

  /** Headline numbers for the Profile tab. */
  const profileStats = [
    { label: "Level", value: String(user?.level || 1), color: colors.cyan },
    { label: "Streak", value: `${user?.streak || 0}d`, color: colors.warning },
    { label: "Tokens", value: (user?.tokens || 0).toLocaleString(), color: colors.purple },
    { label: "Tasks open", value: String(contextStats.openTasks), color: colors.green },
  ];

  const profileRows = [
    { label: "Open tasks", value: String(contextStats.openTasks), color: colors.green },
    { label: "Overdue tasks", value: String(contextStats.overdueTasks), color: contextStats.overdueTasks > 0 ? colors.pink : colors.mutedForeground },
    { label: "Active habits", value: String(contextStats.habitCount), color: colors.purple },
    { label: "Savings goals", value: String(contextStats.goals), color: colors.cyan },
    { label: "Health records", value: contextStats.healthRecords > 0 ? "Present" : "None yet", color: colors.green },
  ];

  const loadMessages = useCallback(async () => {
    if (!user?.dbId) {
      setAiMessages([]);
      return;
    }
    try {
      const records = await AIRepository.findBySession(user.dbId, SESSION_ID);
      setAiMessages(records);
    } catch (error) {
      console.error("Failed to load AI messages", error);
    }
  }, [user?.dbId]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      loadContextStats();
    }, [loadMessages, loadContextStats])
  );

  const clearMessages = async () => {
    if (!user?.dbId) return;
    try {
      await AIRepository.clearHistory(user.dbId);
      await AIRepository.create({
        userId: user.dbId,
        sessionId: SESSION_ID,
        role: 'assistant',
        content: 'Neural link re-established. How can I assist?',
      });
      await loadMessages();
    } catch (error) {
      console.error("Failed to clear messages", error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping || !user?.dbId) return;

    setInput("");
    setIsTyping(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await AIRepository.create({
        userId: user.dbId,
        sessionId: SESSION_ID,
        role: 'user',
        content: text.trim(),
      });
      await loadMessages();

      const response = await AIService.getInstance().sendMessage(text.trim(), SESSION_ID, {
        id: user.dbId,
        name: user.name,
        level: user.level,
        streak: user.streak,
      });

      await AIRepository.create({
        userId: user.dbId,
        sessionId: SESSION_ID,
        role: 'assistant',
        content: response.message.content,
        modelUsed: response.modelUsed,
        tokensUsed: response.tokensUsed,
      });
      await loadMessages();
    } catch (error) {
      console.error("Failed to send message", error);

      // Surface the failure rather than silently dropping the user's message.
      try {
        await AIRepository.create({
          userId: user.dbId,
          sessionId: SESSION_ID,
          role: 'assistant',
          content:
            'I could not generate a response just now. Your message was saved — please try again.',
        });
        await loadMessages();
      } catch (persistError) {
        console.error("Failed to persist error notice", persistError);
      }
    } finally {
      setIsTyping(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleVoice = async () => {
    if (isRecording) return;

    setIsRecording(true);
    setVoiceActive(true);

    try {
      // Check if speech recognition is available
      const SpeechRecognition = require('react-native-speech-recognition');
      const isAvailable = await SpeechRecognition.isAvailable();

      if (!isAvailable) {
        setVoiceActive(false);
        setIsRecording(false);
        return;
      }

      const result = await SpeechRecognition.start(
        'en-US',
        {
          language: 'en-US',
          prompts: false,
          continuous: false,
          interimResults: true,
        }
      );

      setIsRecording(false);
      setVoiceActive(false);
      
      if (result && result.text.trim()) {
        sendMessage(result.text.trim());
      }
    } catch (error) {
      console.error('Voice input failed:', error);
      setIsRecording(false);
      setVoiceActive(false);
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
        <TouchableOpacity onPress={clearMessages} accessibilityLabel="Clear conversation" accessibilityRole="button">
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
          <Text style={[styles.memoryTitle, { color: colors.foreground }]}>DATA CONTEXT</Text>
          <Text style={[styles.memorySub, { color: colors.mutedForeground }]}>
            What the assistant can currently reason about
          </Text>

          {memoryItems.length === 0 ? (
            <GlowCard glowColor={colors.purple} style={styles.memoryCard}>
              <Text style={[styles.memoryValue, { color: colors.mutedForeground }]}>
                No data yet. Add tasks, habits, health metrics, or transactions and they will appear
                here as context the assistant can use.
              </Text>
            </GlowCard>
          ) : (
            memoryItems.map((m, i) => (
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
            ))
          )}

          <GlowCard glowColor={colors.cyan} style={styles.memoryCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={16} color={colors.cyan} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>DATA COVERAGE</Text>
            </View>
            {[
              { label: "Messages exchanged", value: String(aiMessages.length) },
              { label: "Health records", value: String(contextStats.healthRecords) },
              { label: "Transactions recorded", value: String(contextStats.transactions) },
              { label: "Active goals", value: String(contextStats.goals) },
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
          <Text style={[styles.memoryTitle, { color: colors.foreground }]}>YOUR PROFILE</Text>
          <Text style={[styles.memorySub, { color: colors.mutedForeground }]}>
            A summary of what is on record for you
          </Text>

          <GlowCard glowColor={colors.cyan} style={styles.memoryCard}>
            <View style={styles.twinHeader}>
              <View style={[styles.twinAvatar, { backgroundColor: colors.cyan + "22", borderColor: colors.cyan }]}>
                <MaterialCommunityIcons name="account-circle" size={40} color={colors.cyan} />
              </View>
              <View>
                <Text style={[styles.twinName, { color: colors.foreground }]}>{user?.name || "User"}</Text>
                <Text style={[styles.twinSub, { color: colors.cyan }]}>Level {user?.level || 1}</Text>
                <Text style={[styles.twinSync, { color: colors.mutedForeground }]}>
                  {user?.streak || 0} day streak
                </Text>
              </View>
            </View>

            <View style={styles.twinStats}>
              {profileStats.map((d, i) => (
                <View key={i} style={styles.twinStat}>
                  <Text style={[styles.twinStatVal, { color: d.color }]}>{d.value}</Text>
                  <Text style={[styles.twinStatLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
                </View>
              ))}
            </View>
          </GlowCard>

          <GlowCard glowColor={colors.purple} style={styles.memoryCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={16} color={colors.purple} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>AT A GLANCE</Text>
            </View>
            {profileRows.map((s, i) => (
              <View key={i} style={[styles.statRow, { borderBottomColor: colors.border, borderBottomWidth: i < profileRows.length - 1 ? 1 : 0 }]}>
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