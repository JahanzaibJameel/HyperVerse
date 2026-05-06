import { migrations as initialMigrations } from './001_initial';
import { migrations2 as aiChatMigrations } from './002_add_ai_chat';

export const migrations = [
  ...initialMigrations,
  ...aiChatMigrations,
];
