import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '@/lib/stores/authStore';
import { useThemeStore } from '@/lib/stores/themeStore';
import { GlowCard } from '@/components/GlowCard';
import { NeonButton } from '@/components/NeonButton';
import { SkeletonLoader, TaskCardSkeleton, StatsCardSkeleton } from '@/components/SkeletonLoader';
import { DataErrorState } from '@/components/ErrorState';
import { useColors } from '@/hooks/useColors';
import { TaskRepository } from '@/lib/database/repositories/TaskRepository';
import type { Task } from '@/lib/database/models/Task';

const EmptyState = ({ filter, router }: { filter: string; router: any }) => {
  const colors = useColors();

  const getEmptyStateContent = (): {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
  } => {
    switch (filter) {
      case 'completed':
        return {
          icon: 'check-circle-outline',
          title: 'No completed tasks',
          description: 'Complete some tasks to see them here',
        };
      case 'in_progress':
        return {
          icon: 'progress-clock',
          title: 'No tasks in progress',
          description: 'Start working on a task to see it here',
        };
      case 'todo':
        return {
          icon: 'clipboard-outline',
          title: 'No pending tasks',
          description: 'All caught up! Add a new task to get started',
        };
      default:
        return {
          icon: 'clipboard-text-outline',
          title: 'No tasks yet',
          description: 'Create your first task to get started',
        };
    }
  };

  const { icon, title, description } = getEmptyStateContent();

  return (
    <View style={styles.emptyContainer}>
      <GlowCard style={styles.emptyCard} glowColor={colors.cyan}>
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name={icon} size={64} color={colors.cyan} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
          <NeonButton
            label="Create Task"
            onPress={() => router.push('/tasks/new')}
            size="md"
          />
        </View>
      </GlowCard>
    </View>
  );
};

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { themeMode, accentColor } = useThemeStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!user?.dbId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      const records = await TaskRepository.findByUser(user.dbId);
      setTasks(records);
      setError(null);
    } catch (err) {
      console.error('Failed to load tasks', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.dbId]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const handleRetry = () => {
    setIsLoading(true);
    loadTasks();
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === 'completed') {
        await TaskRepository.update(task, (t) => {
          t.status = 'todo';
          t.completedAt = null;
        });
      } else {
        await TaskRepository.markCompleted(task);
      }
      await loadTasks();
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: themeMode === 'dark' ? '#0a0a0a' : '#f8f8f8' }]}>
        <View style={styles.header}>
          <SkeletonLoader width={120} height={28} />
          <SkeletonLoader width={100} height={32} />
        </View>

        <View style={styles.stats}>
          <StatsCardSkeleton count={3} />
        </View>

        <View style={styles.filters}>
          <SkeletonLoader width={80} height={32} />
          <SkeletonLoader width={80} height={32} style={{ marginLeft: 8 }} />
          <SkeletonLoader width={80} height={32} style={{ marginLeft: 8 }} />
        </View>

        <SkeletonLoader width="100%" height={48} style={{ marginBottom: 16 }} />

        <TaskCardSkeleton count={3} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeMode === 'dark' ? '#0a0a0a' : '#f8f8f8' }]}>
        <DataErrorState onRetry={handleRetry} dataType="tasks" />
      </View>
    );
  }

  const isDark = themeMode === 'dark';

  const getAccentColor = (color: string): string => {
    const accentPalette: Record<string, string> = {
      cyan: '#00ffff',
      purple: '#a855f7',
      pink: '#ec4899',
      green: '#10b981',
      orange: '#f97316',
    };
    return accentPalette[color] || '#00ffff';
  };

  const accentColorValue = getAccentColor(accentColor);

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'urgent': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffbb33';
      case 'low': return '#00C851';
      default: return '#666';
    }
  };

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'completed': return '#00C851';
      case 'in_progress': return '#ffbb33';
      case 'cancelled': return '#666';
      default: return accentColorValue;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const renderTask = ({ item }: { item: Task }) => (
    <GlowCard style={styles.taskCard} onPress={() => router.push(`/tasks/${item.id}`)}>
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, { color: isDark ? '#fff' : '#000' }]}>
            {item.title}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleComplete(item)}
            accessibilityLabel={item.status === 'completed' ? 'Mark as not completed' : 'Mark as completed'}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={item.status === 'completed' ? 'check-circle' : 'circle-outline'}
              size={24}
              color={item.status === 'completed' ? '#00C851' : accentColorValue}
            />
          </TouchableOpacity>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.taskDescription, { color: isDark ? '#ccc' : '#666' }]}>
          {item.description}
        </Text>
      )}

      <View style={styles.taskFooter}>
        <View style={styles.taskTags}>
          {item.parsedTags.slice(0, 3).map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: accentColorValue + '20' }]}>
              <Text style={[styles.tagText, { color: accentColorValue }]}>{tag}</Text>
            </View>
          ))}
          {item.parsedTags.length > 3 && (
            <Text style={[styles.moreTags, { color: isDark ? '#888' : '#666' }]}>
              +{item.parsedTags.length - 3}
            </Text>
          )}
        </View>

        <View style={styles.taskReward}>
          <MaterialCommunityIcons name="star" size={16} color={accentColorValue} />
          <Text style={[styles.rewardText, { color: accentColorValue }]}>
            +{item.xpReward} XP
          </Text>
        </View>
      </View>

      {item.dueDate && (
        <View style={styles.dueDate}>
          <MaterialCommunityIcons name="clock" size={14} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.dueDateText, { color: isDark ? '#888' : '#666' }]}>
            {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>
      )}
    </GlowCard>
  );

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#f8f8f8' }]}>
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: isDark ? '#fff' : '#000' }]}
          accessibilityRole="header"
          accessibilityLabel="Tasks Screen"
        >
          Tasks
        </Text>
        <NeonButton
          label="Add Task"
          onPress={() => router.push('/tasks/new')}
          size="sm"
          accessibilityLabel="Create new task"
          accessibilityHint="Opens the task creation screen"
          accessibilityRole="button"
        />
      </View>

      <View style={styles.stats}>
        <GlowCard style={styles.statCard}>
          <Text
            style={[styles.statNumber, { color: accentColorValue }]}
            accessibilityRole="text"
            accessibilityLabel={`Total tasks: ${taskStats.total}`}
          >
            {taskStats.total}
          </Text>
          <Text
            style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}
            accessibilityRole="text"
            accessibilityLabel="Total"
          >
            Total
          </Text>
        </GlowCard>
        <GlowCard style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#00C851' }]}>{taskStats.completed}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Done</Text>
        </GlowCard>
        <GlowCard style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#ffbb33' }]}>{taskStats.inProgress}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>In Progress</Text>
        </GlowCard>
      </View>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'todo', 'in_progress', 'completed'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filter === status && [styles.filterChipActive, { backgroundColor: accentColorValue }]
              ]}
              onPress={() => setFilter(status)}
            >
              <Text style={[
                styles.filterText,
                { color: filter === status ? '#000' : (isDark ? '#ccc' : '#666') }
              ]}>
                {status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TextInput
        style={[styles.searchInput, {
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
          color: isDark ? '#fff' : '#000',
          borderColor: isDark ? '#333' : '#ddd'
        }]}
        placeholder="Search tasks..."
        placeholderTextColor={isDark ? '#666' : '#999'}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredTasks.length === 0 ? styles.emptyList : styles.taskList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState filter={filter} router={router} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filters: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
    marginRight: 8,
  },
  filterChipActive: {
    // backgroundColor will be set dynamically
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  taskActions: {
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTags: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreTags: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  dueDateText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 320,
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
});