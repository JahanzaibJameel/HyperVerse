import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowCard } from "@/components/GlowCard";
import { NeonButton } from "@/components/NeonButton";
import { useAuthStore } from "@/lib/stores/authStore";
import { HabitRepository } from "@/lib/database/repositories/HabitRepository";
import { useColors } from "@/hooks/useColors";
import type { Habit } from "@/lib/database/models/Habit";

const HABIT_COLORS = ["#00d4ff", "#7c3aed", "#00ff9d", "#ffb800", "#ff006e"];

export default function HabitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, addXP } = useAuthStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [title, setTitle] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const loadHabits = useCallback(async () => {
    if (!user?.dbId) {
      setHabits([]);
      return;
    }
    try {
      const records = await HabitRepository.findActive(user.dbId);
      setHabits(records);
    } catch (error) {
      console.error("Failed to load habits", error);
    }
  }, [user?.dbId]);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const handleCreate = async () => {
    if (!title.trim() || !user?.dbId) return;
    try {
      await HabitRepository.create({
        userId: user.dbId,
        title: title.trim(),
        category: 'general',
        frequency: 'daily',
        xpReward: 25,
      });
      addXP(25);
      setTitle("");
      await loadHabits();
    } catch (error) {
      console.error("Failed to create habit", error);
      Alert.alert('Error', 'Failed to create the habit.');
    }
  };

  const handleToggle = async (habit: Habit) => {
    if (!user?.dbId) return;
    try {
      const existing = await HabitRepository.findTodaysEntry(habit.id);
      if (existing) {
        await HabitRepository.undoComplete(habit);
        Alert.alert('Undo', `"${habit.title}" marked incomplete for today.`);
      } else {
        await HabitRepository.complete(habit);
        addXP(habit.xpReward);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await loadHabits();
    } catch (error) {
      console.error("Failed to update habit", error);
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
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>HABITS</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Track daily habits and build streaks
      </Text>

      {/* Create habit */}
      <GlowCard glowColor={colors.cyan} style={styles.createCard}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="New habit (e.g. Drink water)"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
          ]}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        <NeonButton
          label="Add Habit"
          onPress={handleCreate}
          size="sm"
          filled
          disabled={!title.trim()}
          color={colors.cyan}
        />
      </GlowCard>

      {/* Habit list */}
      {habits.length === 0 ? (
        <GlowCard glowColor={colors.purple} style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <MaterialCommunityIcons name="target" size={48} color={colors.purple} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No habits yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Create your first habit above to start building a streak.
            </Text>
          </View>
        </GlowCard>
      ) : (
        habits.map((habit, index) => {
          const color = HABIT_COLORS[index % HABIT_COLORS.length];
          return (
            <GlowCard key={habit.id} glowColor={color} style={styles.habitCard}>
              <TouchableOpacity
                onPress={() => handleToggle(habit)}
                accessibilityLabel={`Mark ${habit.title} complete`}
                accessibilityRole="button"
                style={styles.habitRow}
              >
                <View style={[styles.habitIcon, { backgroundColor: color + "22" }]}>
                  <MaterialCommunityIcons name="check-bold" size={18} color={color} />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitTitle, { color: colors.foreground }]}>{habit.title}</Text>
                  <Text style={[styles.habitMeta, { color: colors.mutedForeground }]}>
                    {habit.frequency} · +{habit.xpReward} XP
                  </Text>
                </View>
                <View style={styles.streakBlock}>
                  <MaterialCommunityIcons name="fire" size={14} color={colors.warning} />
                  <Text style={[styles.streakText, { color: colors.warning }]}>{habit.currentStreak}</Text>
                </View>
              </TouchableOpacity>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: color,
                      width: `${Math.min(100, habit.currentStreak * 100 / Math.max(1, habit.targetCount))}%`,
                    },
                  ]}
                />
              </View>
            </GlowCard>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  screenSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 16 },
  createCard: { marginBottom: 16, gap: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  habitCard: { marginBottom: 12 },
  habitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  habitIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  habitMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  streakBlock: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 12, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  emptyCard: { marginBottom: 16 },
  emptyContent: { alignItems: "center", gap: 12, paddingVertical: 16 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});