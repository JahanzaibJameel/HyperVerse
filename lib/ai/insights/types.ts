/**
 * UserSnapshot — the slice of a user's own data the insight engine reasons over.
 *
 * This is deliberately a plain data shape, not WatermelonDB models: the engine
 * must be testable without a database, and must not hold model references that
 * go stale after a re-render.
 */
export interface SnapshotTask {
  title: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  isOverdue: boolean;
  dueDate: number | null;
  xpReward: number;
}

export interface SnapshotHabit {
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
}

export interface SnapshotHealth {
  steps: number;
  stepsGoal: number;
  calories: number;
  sleepHours: number;
  heartRate: number;
  workouts: number;
  waterIntake: number | null;
  /** Days of health metrics available, oldest first. */
  history: { date: number; sleepHours: number; steps: number }[];
}

export interface SnapshotFinance {
  income: number;
  expenses: number;
  balance: number;
  savings: number;
  savingsRate: number;
  goals: { title: string; current: number; target: number }[];
  recentTransactions: { title: string; amount: number; type: string; date: number }[];
}

export interface UserSnapshot {
  name: string;
  level: number;
  streak: number;
  tasks: SnapshotTask[];
  habits: SnapshotHabit[];
  health: SnapshotHealth | null;
  finance: SnapshotFinance | null;
  recordedAt: number;
}

/** An empty snapshot, used when there is genuinely nothing to reason about. */
export const EMPTY_SNAPSHOT: UserSnapshot = {
  name: 'there',
  level: 1,
  streak: 0,
  tasks: [],
  habits: [],
  health: null,
  finance: null,
  recordedAt: 0,
};
