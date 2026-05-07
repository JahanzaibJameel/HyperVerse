// import { appSchema } from '@nozbe/watermelondb';

// Temporary schema definition for TypeScript compilation
const appSchema = (tables: any[]) => ({
  version: 1,
  tables
});

export const schema = appSchema([
  // User profile and authentication
  {
    name: 'users',
    columns: [
    // User profile and authentication
    {
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
    // Tasks and to-do items
    {
      name: 'tasks',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' },
        { name: 'priority', type: 'string' }, // low, medium, high, urgent
        { name: 'status', type: 'string' }, // todo, in_progress, completed, cancelled
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'xp_reward', type: 'number' },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    },
    // Habits and recurring activities
    {
      name: 'habits',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' },
        { name: 'frequency', type: 'string' }, // daily, weekly, monthly
        { name: 'target_count', type: 'number' },
        { name: 'current_streak', type: 'number' },
        { name: 'best_streak', type: 'number' },
        { name: 'xp_reward', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    },
    // Habit entries/tracking
    {
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
    // Health and fitness data
    {
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
    // Financial data
    {
      name: 'transactions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'type', type: 'string' }, // income, expense, transfer
        { name: 'category', type: 'string' },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    },
    // Financial goals and budgets
    {
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
    // Notes and journal entries
    {
      name: 'notes',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'type', type: 'string' }, // note, journal, idea
        { name: 'mood', type: 'string', isOptional: true }, // happy, sad, neutral, etc.
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'is_private', type: 'boolean' },
        { name: 'is_encrypted', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    },
    // Calendar events
    {
      name: 'events',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'start_date', type: 'number', isIndexed: true },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // meeting, reminder, appointment
        { name: 'is_all_day', type: 'boolean' },
        { name: 'reminder_minutes', type: 'number', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    },
    // AI chat messages
    {
      name: 'ai_messages',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'role', type: 'string' }, // user, assistant, system
        { name: 'content', type: 'string' },
        { name: 'model_used', type: 'string', isOptional: true },
        { name: 'context_used', type: 'string', isOptional: true }, // JSON array of context sources
        { name: 'tokens_used', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    },
    // Achievements and badges
    {
      name: 'achievements',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'string' }, // task, habit, health, finance, social
        { name: 'badge_icon', type: 'string' },
        { name: 'xp_reward', type: 'number' },
        { name: 'unlocked_at', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    },
    // App settings and preferences
    {
      name: 'settings',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' }, // JSON string for complex values
        { name: 'category', type: 'string' }, // theme, notifications, privacy, ai
        { name: 'updated_at', type: 'number' },
      ],
    },
  ],
});
