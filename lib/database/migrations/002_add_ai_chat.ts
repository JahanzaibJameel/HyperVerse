import { migration } from '@nozbe/watermelondb';

export const migrations2 = [
  migration({
    toVersion: 2,
    steps: [
      // Add AI chat functionality
      {
        createTable: {
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
        },
      },
      // Add notes functionality
      {
        createTable: {
          name: 'notes',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'title', type: 'string' },
            { name: 'content', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'mood', type: 'string', isOptional: true },
            { name: 'tags', type: 'string', isOptional: true },
            { name: 'is_private', type: 'boolean' },
            { name: 'is_encrypted', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        },
      },
      // Add events functionality
      {
        createTable: {
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
        },
      },
      // Add habit entries for tracking
      {
        createTable: {
          name: 'habit_entries',
          columns: [
            { name: 'habit_id', type: 'string', isIndexed: true },
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'date', type: 'number' },
            { name: 'completed', type: 'boolean' },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
          ],
        },
      },
      // Add achievements system
      {
        createTable: {
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
        },
      },
      // Add settings system
      {
        createTable: {
          name: 'settings',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'key', type: 'string' },
            { name: 'value', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'updated_at', type: 'number' },
          ],
        },
      },
      // Add financial goals
      {
        createTable: {
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
        },
      },
    ],
  }),
];
