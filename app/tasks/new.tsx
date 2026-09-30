import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowCard } from "@/components/GlowCard";
import { NeonButton } from "@/components/NeonButton";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/lib/stores/authStore";
import { TaskRepository } from "@/lib/database/repositories/TaskRepository";

const CATEGORIES = ["work", "health", "finance", "personal"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const PRIORITY_XP: Record<Priority, number> = {
  low: 10,
  medium: 25,
  high: 50,
  urgent: 100,
};

type Category = (typeof CATEGORIES)[number];
type Priority = (typeof PRIORITIES)[number];

export default function NewTaskScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, addXP } = useAuthStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("work");
  const [priority, setPriority] = useState<Priority>("medium");
  const [isSaving, setIsSaving] = useState(false);

  const canSave = title.trim().length > 0 && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    if (!user?.dbId) {
      Alert.alert('Error', 'No active user. Please restart the app.');
      return;
    }

    try {
      setIsSaving(true);
      await TaskRepository.create({
        userId: user.dbId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        xpReward: PRIORITY_XP[priority],
      });
      addXP(25);
      router.back();
    } catch (error) {
      console.error('Failed to create task', error);
      Alert.alert('Error', 'Failed to save the task. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Stack.Screen options={{ title: "New Task", headerShown: true }} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GlowCard glowColor={colors.cyan} intensity="low">
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
            ]}
            autoFocus
          />
        </GlowCard>

        <GlowCard glowColor={colors.purple} intensity="low">
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add more detail (optional)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.input,
              styles.multiline,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
        </GlowCard>

        <GlowCard glowColor={colors.green} intensity="low">
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((item) => (
              <NeonButton
                key={item}
                label={item}
                onPress={() => setCategory(item)}
                size="sm"
                filled={category === item}
                color={colors.green}
              />
            ))}
          </View>
        </GlowCard>

        <GlowCard glowColor={colors.warning} intensity="low">
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((item) => (
              <NeonButton
                key={item}
                label={item}
                onPress={() => setPriority(item)}
                size="sm"
                filled={priority === item}
                color={colors.warning}
              />
            ))}
          </View>
        </GlowCard>

        <View style={styles.actions}>
          <NeonButton label="Cancel" onPress={() => router.back()} size="md" />
          <NeonButton
            label={isSaving ? "Saving" : "Create Task"}
            onPress={handleSave}
            size="md"
            filled
            disabled={!canSave}
            color={colors.cyan}
          />
        </View>

        <View style={styles.hint}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.mutedForeground} />
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>Completing this task earns XP</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  hintText: {
    fontSize: 12,
  },
});
