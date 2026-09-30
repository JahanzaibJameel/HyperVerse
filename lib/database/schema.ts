import { appSchema, tableSchema } from '@nozbe/watermelondb';
import { schemaMigrations, unsafeExecuteSql } from '@nozbe/watermelondb/Schema/migrations';

/**
 * Migrations, oldest first. Each entry takes the app from version `toVersion - 1`
 * to `toVersion`, and `schema.version` below must equal the last `toVersion` or
 * WatermelonDB refuses to open the database.
 *
 * WatermelonDB 0.27 supports exactly three step types: `create_table`,
 * `add_columns`, and `sql`. There is no `drop_table`, `rename_table`, or
 * record-copying step — which is why an earlier attempt in this repo called a
 * `migration` API that does not exist.
 *
 * Version history:
 *   1 — initial schema, all twelve tables.
 *   2 — dropped `notes.is_encrypted`. The column asserted that a note was
 *       encrypted at rest, and nothing ever wrote an encrypted value, so a row
 *       with `is_encrypted: true` was stored as plaintext. React Native has no
 *       bundled authenticated-encryption primitive (expo-crypto offers hashing
 *       and random bytes, not AES-GCM), so shipping a column that misstates a
 *       security property is worse than omitting it. `is_private` remains and is
 *       enforced in the repository layer.
 */
export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        unsafeExecuteSql('ALTER TABLE "notes" DROP COLUMN "is_encrypted";'),
      ],
    },
  ],
});

/**
 * Schema at the current version. Keep `version` in step with the last migration
 * and add a new migration whenever this changes.
 */
export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'device_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'level', type: 'number' },
        { name: 'xp', type: 'number' },
        { name: 'xp_to_next_level', type: 'number' },
        { name: 'streak', type: 'number' },
        { name: 'tokens', type: 'number' },
        { name: 'nfts', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' },
        { name: 'priority', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'xp_reward', type: 'number' },
        { name: 'tags', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'habits',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' },
        { name: 'frequency', type: 'string' },
        { name: 'target_count', type: 'number' },
        { name: 'current_streak', type: 'number' },
        { name: 'best_streak', type: 'number' },
        { name: 'xp_reward', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'habit_entries',
      columns: [
        { name: 'habit_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number' },
        { name: 'completed', type: 'boolean' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'health_metrics',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'steps', type: 'number' },
        { name: 'steps_goal', type: 'number' },
        { name: 'calories', type: 'number' },
        { name: 'sleep_hours', type: 'number' },
        { name: 'heart_rate', type: 'number' },
        { name: 'weight', type: 'number', isOptional: true },
        { name: 'workouts', type: 'number' },
        { name: 'water_intake', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'type', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'tags', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'financial_goals',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'target_amount', type: 'number' },
        { name: 'current_amount', type: 'number' },
        { name: 'target_date', type: 'number', isOptional: true },
        { name: 'category', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notes',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'mood', type: 'string', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true },
        { name: 'is_private', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'events',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'start_date', type: 'number', isIndexed: true },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'type', type: 'string' },
        { name: 'is_all_day', type: 'boolean' },
        { name: 'reminder_minutes', type: 'number', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'ai_messages',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'role', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'model_used', type: 'string', isOptional: true },
        { name: 'context_used', type: 'string', isOptional: true },
        { name: 'tokens_used', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'achievements',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'badge_icon', type: 'string' },
        { name: 'xp_reward', type: 'number' },
        { name: 'unlocked_at', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'settings',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

/** Tables whose columns belong to the owning user, for cascading deletes. */
export const USER_OWNED_TABLES = [
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
] as const;
