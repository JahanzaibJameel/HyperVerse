/**
 * Repository layer — the only place screens should touch WatermelonDB.
 *
 * Each repository is a thin wrapper around `database.get<T>(table)` queries,
 * scoped to the current user. Repositories are plain objects (no React hooks)
 * so they can be called from anywhere: hooks, stores, or screens.
 *
 * All mutations must run inside `database.write(...)`. The repositories here
 * always wrap the call for the caller so a screen never has to remember that
 * rule.
 */
export { TaskRepository } from './TaskRepository';
export { HealthRepository } from './HealthRepository';
export { FinanceRepository } from './FinanceRepository';
export { AIRepository } from './AIRepository';
export { UserRepository } from './UserRepository';
export { HabitRepository } from './HabitRepository';
export { SettingsRepository } from './SettingsRepository';