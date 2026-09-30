import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowCard } from "@/components/GlowCard";
import { NeonButton } from "@/components/NeonButton";
import { useColors } from "@/hooks/useColors";
import { TaskRepository } from "@/lib/database/repositories/TaskRepository";
import type { Task } from "@/lib/database/models/Task";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#6a8aaa",
  medium: "#00d4ff",
  high: "#ffb800",
  urgent: "#ff3b6b",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "#6a8aaa",
  in_progress: "#ffb800",
  completed: "#00ff9d",
  cancelled: "#666",
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        try {
          const record = await TaskRepository.findById(id);
          if (!cancelled) {
            setTask(record ?? null);
          }
        } catch (error) {
          console.error('Failed to load task', error);
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

      load();
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  const handleToggleComplete = async () => {
    if (!task) return;
    try {
      if (task.status === 'completed') {
        await TaskRepository.update(task, (t) => {
          t.status = 'todo';
          t.completedAt = null;
        });
      } else {
        await TaskRepository.markCompleted(task);
      }
      setTask(await TaskRepository.findById(task.id) ?? null);
    } catch (error) {
      console.error('Failed to update task', error);
      Alert.alert('Error', 'Failed to update the task.');
    }
  };

  const handleDelete = () => {
    if (!task) return;
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await TaskRepository.remove(task);
            router.back();
          } catch (error) {
            console.error('Failed to delete task', error);
            Alert.alert('Error', 'Failed to delete the task.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Task", headerShown: true }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? null : !task ? (
          <GlowCard glowColor={colors.pink}>
            <Text style={[styles.title, { color: colors.foreground }]}>Task not found</Text>
            <Text style={[styles.id, { color: colors.mutedForeground }]}>
              This task may have been deleted.
            </Text>
          </GlowCard>
        ) : (
          <>
            <GlowCard glowColor={colors.cyan}>
              <Text style={[styles.title, { color: colors.foreground }]}>{task.title}</Text>
              {task.description ? (
                <Text style={[styles.description, { color: colors.mutedForeground }]}>
                  {task.description}
                </Text>
              ) : null}
            </GlowCard>

            <GlowCard glowColor={PRIORITY_COLORS[task.priority] ?? colors.purple} intensity="low">
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Priority</Text>
              <View style={styles.row}>
                <MaterialCommunityIcons
                  name="flag-outline"
                  size={16}
                  color={PRIORITY_COLORS[task.priority] ?? colors.purple}
                />
                <Text style={[styles.value, { color: colors.foreground }]}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
            </GlowCard>

            <GlowCard glowColor={STATUS_COLORS[task.status] ?? colors.cyan} intensity="low">
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Status</Text>
              <View style={styles.row}>
                <MaterialCommunityIcons
                  name="circle-outline"
                  size={16}
                  color={STATUS_COLORS[task.status] ?? colors.cyan}
                />
                <Text style={[styles.value, { color: colors.foreground }]}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </GlowCard>

            <GlowCard glowColor={colors.warning} intensity="low">
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Reward</Text>
              <View style={styles.row}>
                <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
                <Text style={[styles.value, { color: colors.foreground }]}>
                  +{task.xpReward} XP
                </Text>
              </View>
            </GlowCard>

            {task.parsedTags.length > 0 && (
              <GlowCard glowColor={colors.purple} intensity="low">
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Tags</Text>
                <View style={styles.tagRow}>
                  {task.parsedTags.map((tag) => (
                    <View
                      key={tag}
                      style={[styles.tag, { backgroundColor: colors.purple + '20' }]}
                    >
                      <Text style={[styles.tagText, { color: colors.purple }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </GlowCard>
            )}

            {task.dueDate && (
              <GlowCard glowColor={colors.orange} intensity="low">
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Due</Text>
                <View style={styles.row}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.orange} />
                  <Text style={[styles.value, { color: colors.foreground }]}>
                    {new Date(task.dueDate).toLocaleString()}
                  </Text>
                </View>
              </GlowCard>
            )}

            <NeonButton
              label={task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
              onPress={handleToggleComplete}
              size="md"
              color={task.status === 'completed' ? colors.warning : colors.green}
            />

            <NeonButton
              label="Delete Task"
              onPress={handleDelete}
              size="md"
              color={colors.pink}
            />

            <NeonButton label="Back to Tasks" onPress={() => router.back()} size="md" color={colors.cyan} />
          </>
        )}
      </ScrollView>

      <View style={{ height: insets.bottom }} />
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
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  id: {
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  value: {
    fontSize: 15,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export { PRIORITY_COLORS };