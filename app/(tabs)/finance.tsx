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
import { MiniBarChart } from "@/components/MiniBarChart";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const SPENDING_DATA = [3100, 2800, 3400, 2950, 3200, 2700, 3200];
const SPENDING_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const INCOME_DATA = [7200, 8100, 8000, 9200, 8500, 8800, 8500];

const TRANSACTIONS = [
  { label: "Crypto Yield", amount: 420, type: "income" as const, icon: "ethereum" as const, time: "2h ago" },
  { label: "Smart Home Hub", amount: -89, type: "expense" as const, icon: "home-automation" as const, time: "5h ago" },
  { label: "Freelance Project", amount: 1800, type: "income" as const, icon: "laptop" as const, time: "Yesterday" },
  { label: "Cloud Services", amount: -45, type: "expense" as const, icon: "cloud" as const, time: "Yesterday" },
  { label: "NFT Sale", amount: 650, type: "income" as const, icon: "image-outline" as const, time: "2d ago" },
  { label: "Quantum VPN", amount: -12, type: "expense" as const, icon: "shield-check" as const, time: "3d ago" },
];

const GOALS = [
  { name: "Emergency Fund", current: 8400, target: 10000, color: "#00d4ff", icon: "shield-check" as const },
  { name: "Investment Portfolio", current: 12400, target: 20000, color: "#7c3aed", icon: "chart-line" as const },
  { name: "Hardware Upgrade", current: 950, target: 2000, color: "#ffb800", icon: "desktop-classic" as const },
];

const AI_INSIGHTS = [
  { text: "At current savings rate: +$8K in 90 days", color: "#00ff9d", icon: "trending-up" as const },
  { text: "Crypto portfolio up 4.2% — consider rebalancing", color: "#ffb800", icon: "swap-horizontal" as const },
  { text: "Subscription audit: 3 unused services found ($57/mo)", color: "#ff006e", icon: "alert-circle" as const },
];

export default function FinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { finance, addXP } = useApp();
  const [savedGoal, setSavedGoal] = useState(false);
  const [view, setView] = useState<"spending" | "income">("spending");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>FINANCE</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>AI-powered wealth engine</Text>

      {/* Balance hero */}
      <LinearGradient
        colors={["#111828", "#0d1422", "#090f1a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.balanceCard, { borderColor: colors.warning + "33" }]}
      >
        <View style={[styles.glowOrb, { backgroundColor: colors.warning }]} />
        <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>NET WORTH</Text>
        <Text style={[styles.balanceValue, { color: colors.foreground }]}>
          ${finance.balance.toLocaleString()}
        </Text>
        <Text style={[styles.balanceChange, { color: colors.green }]}>+$2,847 this month (+13%)</Text>
        <View style={styles.balanceRow}>
          {[
            { icon: "arrow-up-circle" as const, val: `+$${finance.income.toLocaleString()}`, label: "INCOME", color: colors.green },
            { icon: "arrow-down-circle" as const, val: `-$${finance.expenses.toLocaleString()}`, label: "SPENT", color: colors.pink },
            { icon: "safe" as const, val: `$${finance.savings.toLocaleString()}`, label: "SAVED", color: colors.cyan },
          ].map((b, i) => (
            <View key={i} style={styles.balanceItem}>
              <MaterialCommunityIcons name={b.icon} size={18} color={b.color} />
              <Text style={[styles.balanceNum, { color: b.color }]}>{b.val}</Text>
              <Text style={[styles.balanceItemLabel, { color: colors.mutedForeground }]}>{b.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Chart card */}
      <GlowCard glowColor={colors.cyan} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="chart-bar" size={16} color={colors.cyan} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>7-MONTH TREND</Text>
          <View style={styles.chartToggle}>
            {(["spending", "income"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setView(t);
                }}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: view === t ? colors.cyan + "22" : "transparent",
                    borderColor: view === t ? colors.cyan : "transparent",
                  },
                ]}
              >
                <Text style={[styles.toggleText, { color: view === t ? colors.cyan : colors.mutedForeground }]}>
                  {t === "spending" ? "SPEND" : "INCOME"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <MiniBarChart
            data={view === "spending" ? SPENDING_DATA : INCOME_DATA}
            labels={SPENDING_LABELS}
            color={view === "spending" ? colors.pink : colors.green}
            height={90}
            accentIndex={6}
          />
        </ScrollView>
        <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>
          {view === "spending"
            ? `Avg monthly spend: $${Math.round(SPENDING_DATA.reduce((a, b) => a + b, 0) / 7).toLocaleString()}`
            : `Avg monthly income: $${Math.round(INCOME_DATA.reduce((a, b) => a + b, 0) / 7).toLocaleString()}`}
        </Text>
      </GlowCard>

      {/* Budget gauge */}
      <GlowCard glowColor={finance.budgetUsed > 80 ? colors.pink : colors.cyan} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="gauge" size={16} color={finance.budgetUsed > 80 ? colors.pink : colors.cyan} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>MONTHLY BUDGET</Text>
          <Text style={[styles.budgetPct, { color: finance.budgetUsed > 80 ? colors.pink : colors.cyan }]}>
            {finance.budgetUsed}%
          </Text>
        </View>
        <StatBar
          label="Budget used"
          value={finance.expenses}
          max={Math.round(finance.expenses / (finance.budgetUsed / 100))}
          color={finance.budgetUsed > 80 ? colors.pink : colors.cyan}
        />
        <View style={[styles.aiBox, { backgroundColor: colors.purple + "12", borderColor: colors.purple + "30" }]}>
          <MaterialCommunityIcons name="brain" size={14} color={colors.purple} />
          <Text style={[styles.aiText, { color: colors.foreground }]}>
            AI Prediction: You'll save an extra $2,400 this month. Ideal time to invest in index funds.
          </Text>
        </View>
      </GlowCard>

      {/* AI Insights */}
      <GlowCard glowColor={colors.green} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="robot" size={16} color={colors.green} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>AI WEALTH INSIGHTS</Text>
        </View>
        {AI_INSIGHTS.map((ins, i) => (
          <View
            key={i}
            style={[styles.insightRow, { borderBottomColor: colors.border, borderBottomWidth: i < AI_INSIGHTS.length - 1 ? 1 : 0 }]}
          >
            <View style={[styles.insightIcon, { backgroundColor: ins.color + "20" }]}>
              <MaterialCommunityIcons name={ins.icon} size={16} color={ins.color} />
            </View>
            <Text style={[styles.insightText, { color: colors.foreground }]}>{ins.text}</Text>
          </View>
        ))}
      </GlowCard>

      {/* Goals */}
      <GlowCard glowColor={colors.purple} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="flag-checkered" size={16} color={colors.purple} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>GAMIFIED GOALS</Text>
        </View>
        {GOALS.map((g, i) => (
          <View key={i} style={styles.goalItem}>
            <View style={styles.goalHeader}>
              <View style={[styles.goalIcon, { backgroundColor: g.color + "22" }]}>
                <MaterialCommunityIcons name={g.icon} size={16} color={g.color} />
              </View>
              <Text style={[styles.goalName, { color: colors.foreground }]}>{g.name}</Text>
              <Text style={[styles.goalProgress, { color: g.color }]}>
                {Math.round((g.current / g.target) * 100)}%
              </Text>
            </View>
            <StatBar
              label=""
              value={g.current}
              max={g.target}
              color={g.color}
            />
            <Text style={[styles.goalSub, { color: colors.mutedForeground }]}>
              ${g.current.toLocaleString()} / ${g.target.toLocaleString()}
            </Text>
          </View>
        ))}
        <TouchableOpacity
          onPress={() => {
            if (!savedGoal) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              addXP(50);
              setSavedGoal(true);
            }
          }}
          style={[
            styles.addGoal,
            { borderColor: savedGoal ? colors.green : colors.border, backgroundColor: savedGoal ? colors.green + "12" : "transparent" },
          ]}
        >
          <MaterialCommunityIcons name={savedGoal ? "check" : "plus"} size={18} color={savedGoal ? colors.green : colors.mutedForeground} />
          <Text style={[styles.addGoalText, { color: savedGoal ? colors.green : colors.mutedForeground }]}>
            {savedGoal ? "GOAL ADDED +50 XP" : "ADD NEW GOAL"}
          </Text>
        </TouchableOpacity>
      </GlowCard>

      {/* Transactions */}
      <GlowCard glowColor={colors.green} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.green} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>TRANSACTIONS</Text>
        </View>
        {TRANSACTIONS.map((t, i) => (
          <View
            key={i}
            style={[styles.txRow, { borderBottomColor: colors.border, borderBottomWidth: i < TRANSACTIONS.length - 1 ? 1 : 0 }]}
          >
            <View style={[styles.txIcon, { backgroundColor: (t.type === "income" ? colors.green : colors.pink) + "20" }]}>
              <MaterialCommunityIcons name={t.icon} size={18} color={t.type === "income" ? colors.green : colors.pink} />
            </View>
            <View style={styles.txInfo}>
              <Text style={[styles.txLabel, { color: colors.foreground }]}>{t.label}</Text>
              <Text style={[styles.txTime, { color: colors.mutedForeground }]}>{t.time}</Text>
            </View>
            <Text style={[styles.txAmount, { color: t.type === "income" ? colors.green : colors.pink }]}>
              {t.amount > 0 ? "+" : ""}${Math.abs(t.amount)}
            </Text>
          </View>
        ))}
      </GlowCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  screenSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 16 },
  balanceCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16, overflow: "hidden" },
  glowOrb: { position: "absolute", width: 150, height: 150, borderRadius: 75, top: -60, right: -30, opacity: 0.05 },
  balanceLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  balanceValue: { fontSize: 44, fontFamily: "Inter_700Bold", marginVertical: 6 },
  balanceChange: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 16 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  balanceItem: { alignItems: "center", gap: 4 },
  balanceNum: { fontSize: 15, fontFamily: "Inter_700Bold" },
  balanceItemLabel: { fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 1 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2, flex: 1 },
  chartToggle: { flexDirection: "row", gap: 4 },
  toggleBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  toggleText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  chartSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 8 },
  budgetPct: { fontSize: 18, fontFamily: "Inter_700Bold" },
  aiBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12 },
  aiText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  insightRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  insightIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  insightText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  goalItem: { marginBottom: 16 },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  goalIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  goalName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  goalProgress: { fontSize: 14, fontFamily: "Inter_700Bold" },
  goalSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  addGoal: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  addGoalText: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  txTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
