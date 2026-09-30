import { TaskRepository } from '../../database/repositories/TaskRepository';
import { HealthRepository } from '../../database/repositories/HealthRepository';
import { FinanceRepository } from '../../database/repositories/FinanceRepository';
import { HabitRepository } from '../../database/repositories/HabitRepository';

import { EMPTY_SNAPSHOT, type UserSnapshot } from './types';

/**
 * Reads the user's real records and assembles the snapshot the insight engine
 * reasons over. Everything is best-effort: a failure in one domain degrades that
 * section rather than failing the whole response, so a database hiccup in one
 * table cannot make the assistant unusable.
 */
export async function buildSnapshot(userId: string, name = 'there'): Promise<UserSnapshot> {
  if (!userId) return EMPTY_SNAPSHOT;

  const [tasks, habits, healthMetrics, finance, goals, transactions] = await Promise.all([
    TaskRepository.findByUser(userId).catch(() => []),
    HabitRepository.findActive(userId).catch(() => []),
    HealthRepository.findByUser(userId).catch(() => []),
    FinanceRepository.summary(userId).catch(() => null),
    FinanceRepository.findActiveGoals(userId).catch(() => []),
    FinanceRepository.findTransactions(userId, 10).catch(() => []),
  ]);

  const latestHealth = healthMetrics.length > 0 ? healthMetrics[0] : null;
  const history = [...healthMetrics]
    .slice(0, 14)
    .reverse()
    .map((m) => ({ date: m.date, sleepHours: m.sleepHours, steps: m.steps }));

  // Which habits already have an entry for today.
  const completedToday = new Set<string>();
  for (const habit of habits) {
    const entry = await HabitRepository.findTodaysEntry(habit.id).catch(() => undefined);
    if (entry?.completed) completedToday.add(habit.id);
  }

  return {
    name,
    level: 0,
    streak: 0,
    tasks: tasks.map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      category: t.category,
      isOverdue: t.isOverdue,
      dueDate: t.dueDate,
      xpReward: t.xpReward,
    })),
    habits: habits.map((h) => ({
      title: h.title,
      frequency: h.frequency,
      currentStreak: h.currentStreak,
      bestStreak: h.bestStreak,
      completedToday: completedToday.has(h.id),
    })),
    health: latestHealth
      ? {
          steps: latestHealth.steps,
          stepsGoal: latestHealth.stepsGoal,
          calories: latestHealth.calories,
          sleepHours: latestHealth.sleepHours,
          heartRate: latestHealth.heartRate,
          workouts: latestHealth.workouts,
          waterIntake: latestHealth.waterIntake,
          history,
        }
      : null,
    finance: finance
      ? {
          income: finance.income,
          expenses: finance.expenses,
          balance: finance.balance,
          savings: finance.savings,
          savingsRate:
            finance.income > 0
              ? Math.round((1 - finance.expenses / finance.income) * 100)
              : 0,
          goals: goals.map((g) => ({
            title: g.title,
            current: g.currentAmount,
            target: g.targetAmount,
          })),
          recentTransactions: transactions.slice(0, 5).map((t) => ({
            title: t.title,
            amount: t.amount,
            type: t.type,
            date: t.date,
          })),
        }
      : null,
    recordedAt: Date.now(),
  };
}

/** Attach level and streak from the auth profile, which the engine also displays. */
export function applyUserProfile(
  snapshot: UserSnapshot,
  profile: { name?: string | null; level?: number; streak?: number } | null | undefined
): UserSnapshot {
  if (!profile) return snapshot;
  return {
    ...snapshot,
    name: profile.name || snapshot.name,
    level: profile.level ?? snapshot.level,
    streak: profile.streak ?? snapshot.streak,
  };
}
