import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { migrations } from './migrations';
import { schema } from './schema';

// Database configuration
const adapter = new SQLiteAdapter({
  dbName: 'HyperVerse',
  schema,
  migrations,
  // Enable experimental features for better performance
  experimentalUseJSI: true,
  // Enable better performance with the new architecture
  jsi: true,
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [],
  actionsEnabled: true,
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

export const isDatabaseReady = () => {
  return database.adapter.isReady;
};
