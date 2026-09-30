// Database barrel exports
export { database, closeDatabase, resetDatabase, isDatabaseReady, whenDatabaseReady } from './database';
export { schema } from './schema';
export { useDatabase } from './useDatabase';

// Model exports
export { Task } from './models/Task';
export { User } from './models/User';
export { Habit } from './models/Habit';
export { HabitEntry } from './models/HabitEntry';
export { HealthMetric } from './models/HealthMetric';
export { Transaction } from './models/Transaction';
export { FinancialGoal } from './models/FinancialGoal';
export { Note } from './models/Note';
export { Event } from './models/Event';
export { AIMessage } from './models/AIMessage';
export { Achievement } from './models/Achievement';
export { Setting } from './models/Setting';

// Repository exports
export {
  TaskRepository,
  HealthRepository,
  FinanceRepository,
  AIRepository,
  UserRepository,
  HabitRepository,
  SettingsRepository,
} from './repositories';

// Type exports
export type { Database } from '@nozbe/watermelondb';