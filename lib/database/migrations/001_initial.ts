import { migration } from '@nozbe/watermelondb';

export const migrations = [
  migration({
    toVersion: 1,
    steps: [
      // Create initial tables for core functionality
      {
        createTable: {
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
        },
      },
      {
        createTable: {
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
        },
      },
      {
        createTable: {
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
        },
      },
      {
        createTable: {
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
        },
      },
      {
        createTable: {
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
        },
      },
    ],
  }),
];
