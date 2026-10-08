import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowCard } from "@/components/GlowCard";
import { StatBar } from "@/components/StatBar";
import { MiniBarChart } from "@/components/MiniBarChart";
import { useAuthStore } from "@/lib/stores/authStore";
import { FinanceRepository } from "@/lib/database/repositories/FinanceRepository";
import { useColors } from "@/hooks/useColors";
import type { Transaction } from "@/lib/database/models/Transaction";
import type { FinancialGoal } from "@/lib/database/models/FinancialGoal";

const EMPTY_SUMMARY = {
  balance: 0,
  income: 0,
  expenses: 0,
  savings: 0,
  investments: 0,
  budgetUsed: 0,
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function FinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, addXP } = useAuthStore();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [view, setView] = useState<"spending" | "income">("spending");
  const [savedGoal, setSavedGoal] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const loadFinance = useCallback(async () => {
    if (!user?.dbId) {
      setSummary(EMPTY_SUMMARY);
      setTransactions([]);
      setGoals([]);
      return;
    }
    try {
      const [finSummary, txs, gals] = await Promise.all([
        FinanceRepository.summary(user.dbId),
        FinanceRepository.findTransactions(user.dbId),
        FinanceRepository.findActiveGoals(user.dbId),
      ]);
      setSummary(finSummary);
      setTransactions(txs);
      setGoals(gals);
    } catch (error) {
      console.error("Failed to load finance data", error);
    }
  }, [user?.dbId]);

  useFocusEffect(
    useCallback(() => {
      loadFinance();
    }, [loadFinance])
  );

  // Monthly series for the trend chart, built from real transactions.
  const { spendingData, incomeData, chartLabels } = (() => {
    const now = new Date();
    const monthCount = 7;
    const buckets = Array.from({ length: monthCount }, () => ({ spend: 0, income: 0 }));
    const labels: string[] = [];

    for (let i = 0; i < monthCount; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
      labels.push(MONTH_LABELS[d.getMonth()]);
    }

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const monthsAgo =
        (now.getFullYear() - txDate.getFullYear()) * 12 + (now.getMonth() - txDate.getMonth());
      const bucketIndex = monthCount - 1 - monthsAgo;
      if (bucketIndex < 0 || bucketIndex >= monthCount) continue;
      if (tx.type === 'income') {
        buckets[bucketIndex].income += tx.amount;
      } else if (tx.type === 'expense') {
        buckets[bucketIndex].spend += tx.amount;
      }
    }

    return {
      spendingData: buckets.map((b) => b.spend),
      incomeData: buckets.map((b) => b.income),
      chartLabels: labels,
    };
  })();

  const hasChartData = spendingData.some((v) => v > 0) || incomeData.some((v) => v > 0);

  const [customGoal, setCustomGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCategory, setGoalCategory] = useState<Category>('savings');

  const handleAddGoal = async () => {
    if (savedGoal || !user?.dbId) return;
    
    // If custom goal is enabled, use the custom values
    if (customGoal) {
      if (!goalTitle.trim() || !goalTarget.trim()) {
        Alert.alert('Error', 'Please provide both a title and target amount for the goal');
        return;
      }
      
      const targetAmount = parseFloat(goalTarget);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        Alert.alert('Error', 'Please enter a valid target amount');
        return;
      }
    }

    try {
      if (customGoal) {
        await FinanceRepository.createGoal({
          userId: user.dbId,
          title: goalTitle.trim(),
          targetAmount: parseFloat(goalTarget),
          currentAmount: 0,
          category: goalCategory,
        });
      } else {
        await FinanceRepository.createGoal({
          userId: user.dbId,
          title: 'New Savings Goal',
          targetAmount: 1000,
          currentAmount: 0,
          category: 'savings',
        });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addXP(50);
      setSavedGoal(true);
      await loadFinance();
    } catch (error) {
      console.error('Failed to create goal', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
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
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>FINANCE</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>Personal wealth overview</Text>

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
          ${summary.balance.toLocaleString()}
        </Text>
        <View style={styles.balanceRow}>
          {[
            { icon: "arrow-up-circle" as const, val: `+$${summary.income.toLocaleString()}`, label: "INCOME", color: colors.green },
            { icon: "arrow-down-circle" as const, val: `-$${summary.expenses.toLocaleString()}`, label: "SPENT", color: colors.pink },
            { icon: "safe" as const, val: `$${summary.savings.toLocaleString()}`, label: "SAVED", color: colors.cyan },
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
        {hasChartData ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <MiniBarChart
                data={view === "spending" ? spendingData : incomeData}
                labels={chartLabels}
                color={view === "spending" ? colors.pink : colors.green}
                height={90}
                accentIndex={6}
              />
            </ScrollView>
            <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>
              {view === "spending"
                ? `Avg monthly spend: $${Math.round(spendingData.reduce((a, b) => a + b, 0) / 7).toLocaleString()}`
                : `Avg monthly income: $${Math.round(incomeData.reduce((a, b) => a + b, 0) / 7).toLocaleString()}`}
            </Text>
          </>
        ) : (
          <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>
            No transactions yet. Monthly trends will appear here.
          </Text>
        )}
      </GlowCard>

      {/* Budget gauge */}
      <GlowCard glowColor={summary.budgetUsed > 80 ? colors.pink : colors.cyan} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="gauge" size={16} color={summary.budgetUsed > 80 ? colors.pink : colors.cyan} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>MONTHLY BUDGET</Text>
          <Text style={[styles.budgetPct, { color: summary.budgetUsed > 80 ? colors.pink : colors.cyan }]}>
            {summary.budgetUsed}%
          </Text>
        </View>
        <StatBar
          label="Budget used"
          value={summary.expenses}
          max={summary.income}
          color={summary.budgetUsed > 80 ? colors.pink : colors.cyan}
        />
      </GlowCard>

      {/* Goals */}
      <GlowCard glowColor={colors.purple} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="flag-checkered" size={16} color={colors.purple} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>SAVINGS GOALS</Text>
        </View>
        {goals.length === 0 ? (
          <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>
            No goals yet. Create one to start tracking savings.
          </Text>
        ) : (
          goals.map((g) => (
            <View key={g.id} style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <View style={[styles.goalIcon, { backgroundColor: colors.purple + "22" }]}>
                  <MaterialCommunityIcons name="flag" size={16} color={colors.purple} />
                </View>
                <Text style={[styles.goalName, { color: colors.foreground }]}>{g.title}</Text>
                <Text style={[styles.goalProgress, { color: colors.purple }]}>
                  {Math.round(g.progress * 100)}%
                </Text>
              </View>
              <StatBar label="" value={g.currentAmount} max={g.targetAmount} color={colors.purple} />
              <Text style={[styles.goalSub, { color: colors.mutedForeground }]}>
                ${g.currentAmount.toLocaleString()} / ${g.targetAmount.toLocaleString()}
              </Text>
            </View>
          ))
        )}
        <TouchableOpacity
          onPress={handleAddGoal}
          accessibilityLabel={savedGoal ? 'Goal added' : 'Add new savings goal'}
          accessibilityRole="button"
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
        {transactions.length === 0 ? (
          <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>
            No transactions recorded yet.
          </Text>
        ) : (
          transactions.map((t, i) => (
            <View
              key={t.id}
              style={[styles.txRow, { borderBottomColor: colors.border, borderBottomWidth: i < transactions.length - 1 ? 1 : 0 }]}
            >
              <View style={[styles.txIcon, { backgroundColor: (t.isIncome ? colors.green : colors.pink) + "20" }]}>
                <MaterialCommunityIcons
                  name={t.isIncome ? "arrow-up" : "arrow-down"}
                  size={18}
                  color={t.isIncome ? colors.green : colors.pink}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txLabel, { color: colors.foreground }]}>{t.title}</Text>
                <Text style={[styles.txTime, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(t.date)} · {t.category}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: t.isIncome ? colors.green : colors.pink }]}>
                {t.isIncome ? "+" : "-"}${t.amount.toLocaleString()}
              </Text>
            </View>
          ))
        )}
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
  emptyNote: { fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 8 },
});