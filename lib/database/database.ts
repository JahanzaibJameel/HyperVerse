import { Database, Q } from '@nozbe/watermelondb';
import type { Collection } from '@nozbe/watermelondb';

import adapter from './adapter';
import {
  User,
  Task,
  Habit,
  HabitEntry,
  HealthMetric,
  Transaction,
  FinancialGoal,
  Note,
  Event,
  AIMessage,
  Achievement,
  Setting,
} from './models';

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Task,
    Habit,
    HabitEntry,
    HealthMetric,
    Transaction,
    FinancialGoal,
    Note,
    Event,
    AIMessage,
    Achievement,
    Setting,
  ],
});

// Database utility functions
export const closeDatabase = async () => {
  await database.write(async () => {
    // Close all connections
  });
};

export const resetDatabase = async () => {
  await database.unsafeResetDatabase();
};

let databaseReady = false;

// Not every adapter exposes `initializingPromise` (the SQLite adapter does, the
// pure-JS LokiJS adapter does not). Fall back to a resolved promise so readiness
// observation never throws, and note that WatermelonDB's work queue already
// serializes calls until the adapter finishes setting up.
const adapterInitialization: Promise<unknown> | undefined = (
  adapter as unknown as { initializingPromise?: Promise<unknown> }
).initializingPromise;

if (adapterInitialization && typeof adapterInitialization.then === 'function') {
  void adapterInitialization
    .then(() => {
      databaseReady = true;
    })
    .catch((error) => {
      databaseReady = false;
      console.error('Database initialization failed', error);
    });
} else {
  databaseReady = true;
}

export const isDatabaseReady = () => databaseReady;

export const whenDatabaseReady = (): Promise<void> =>
  adapterInitialization && typeof adapterInitialization.then === 'function'
    ? adapterInitialization.then(() => undefined)
    : Promise.resolve();

/** Type-safe database access */
export type DatabaseModels = {
  users: User;
  tasks: Task;
  habits: Habit;
  habit_entries: HabitEntry;
  health_metrics: HealthMetric;
  transactions: Transaction;
  financial_goals: FinancialGoal;
  notes: Note;
  events: Event;
  ai_messages: AIMessage;
  achievements: Achievement;
  settings: Setting;
};

/**
 * Permanently delete a user row and every record that references it.
 *
 * `AuthService.deleteProfile()` clears the SecureStore profile, but without this
 * the domain data would survive and remain in the plaintext SQLite file. Callers
 * must invoke it from inside `database.write()`.
 */
export const deleteUserCascade = async (userId: string): Promise<number> => {
  const tables: Array<keyof DatabaseModels> = [
    'tasks',
    'habits',
    'habit_entries',
    'health_metrics',
    'transactions',
    'financial_goals',
    'notes',
    'events',
    'ai_messages',
    'achievements',
    'settings',
  ];

  let deleted = 0;

  for (const table of tables) {
    const records = await database.get(table).query(Q.where('user_id', userId)).fetch();
    for (const record of records) {
      await (record as unknown as { destroyPermanently: () => Promise<void> }).destroyPermanently();
      deleted += 1;
    }
  }

  const users = await database.get('users').query(Q.where('id', userId)).fetch();
  for (const user of users) {
    await (user as unknown as { destroyPermanently: () => Promise<void> }).destroyPermanently();
    deleted += 1;
  }

  return deleted;
};

export { Q };

declare module '@nozbe/watermelondb' {
  interface Database {
    get<M extends keyof DatabaseModels>(name: M): Collection<DatabaseModels[M]>;
  }
}
