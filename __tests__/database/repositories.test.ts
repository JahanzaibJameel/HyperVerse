import { database, whenDatabaseReady, deleteUserCascade } from '@/lib/database/database';
import { UserRepository } from '@/lib/database/repositories/UserRepository';
import { TaskRepository } from '@/lib/database/repositories/TaskRepository';
import { HealthRepository } from '@/lib/database/repositories/HealthRepository';
import { FinanceRepository } from '@/lib/database/repositories/FinanceRepository';
import { AIRepository } from '@/lib/database/repositories/AIRepository';
import { HabitRepository } from '@/lib/database/repositories/HabitRepository';
import { SettingsRepository } from '@/lib/database/repositories/SettingsRepository';
import type { User } from '@/lib/database/models/User';

const DEVICE_ID = 'repo-test-device';

async function ensureUser(): Promise<User> {
  const existing = await UserRepository.findByDeviceId(DEVICE_ID);
  if (existing) return existing;
  return UserRepository.create({ deviceId: DEVICE_ID, name: 'Repo Tester', tokens: 0 });
}

describe('Repository layer', () => {
  let user: User;

  beforeAll(async () => {
    await whenDatabaseReady();
    user = await ensureUser();
  });

  describe('UserRepository', () => {
    it('creates a user row and finds it by device id', async () => {
      const found = await UserRepository.findByDeviceId(DEVICE_ID);
      expect(found).toBeDefined();
      expect(found!.id).toBe(user.id);
      expect(found!.name).toBe('Repo Tester');
    });

    it('upserts without creating a duplicate row', async () => {
      const before = await UserRepository.findByDeviceId(DEVICE_ID);
      const updated = await UserRepository.upsertFromProfile({
        deviceId: DEVICE_ID,
        name: 'Renamed User',
        tokens: 0,
      });
      const after = await UserRepository.findByDeviceId(DEVICE_ID);

      expect(after!.id).toBe(before!.id);
      expect(updated.name).toBe('Renamed User');
      expect(after!.name).toBe('Renamed User');

      // restore for later suites
      await UserRepository.upsertFromProfile({
        deviceId: DEVICE_ID,
        name: 'Repo Tester',
        tokens: 0,
      });
    });
  });

  describe('TaskRepository', () => {
    it('creates a task scoped to the user and reads it back', async () => {
      const task = await TaskRepository.create({
        userId: user.id,
        title: 'Repository Task',
        category: 'work',
        priority: 'high',
        xpReward: 50,
        tags: ['repo', 'test'],
      });

      expect(task.id).toBeDefined();
      expect(task.status).toBe('todo');
      expect(task.parsedTags).toEqual(['repo', 'test']);

      const fetched = await TaskRepository.findById(task.id);
      expect(fetched!.title).toBe('Repository Task');
    });

    it('marks a task completed and stamps completedAt', async () => {
      const task = await TaskRepository.create({
        userId: user.id,
        title: 'Task To Complete',
        category: 'work',
        priority: 'low',
      });

      const updated = await TaskRepository.markCompleted(task);
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).not.toBeNull();

      const refetched = await TaskRepository.findById(task.id);
      expect(refetched!.status).toBe('completed');
    });

    it('returns only that user\'s tasks', async () => {
      const other = await UserRepository.create({ deviceId: 'other-device-repo', name: 'Other' });
      await TaskRepository.create({
        userId: other.id,
        title: 'Belongs To Other',
        category: 'work',
        priority: 'low',
      });

      const mine = await TaskRepository.findByUser(user.id);
      expect(mine.every((t) => t.userId === user.id)).toBe(true);
      expect(mine.some((t) => t.title === 'Belongs To Other')).toBe(false);
    });
  });

  describe('HealthRepository', () => {
    it('upserts a single row for today rather than duplicating', async () => {
      const first = await HealthRepository.upsertToday(user.id, {
        steps: 5000,
        stepsGoal: 10000,
        calories: 1200,
        sleepHours: 7,
        heartRate: 70,
        workouts: 1,
      });

      const second = await HealthRepository.upsertToday(user.id, {
        steps: 8000,
        stepsGoal: 10000,
        calories: 1800,
        sleepHours: 7.5,
        heartRate: 68,
        workouts: 2,
      });

      expect(second.id).toBe(first.id);
      expect(second.steps).toBe(8000);
      expect(second.workouts).toBe(2);

      const all = await HealthRepository.findByUser(user.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todays = all.filter((m) => m.date === today.getTime());
      expect(todays).toHaveLength(1);
    });

    it('findLatest returns the most recent record', async () => {
      const latest = await HealthRepository.findLatest(user.id);
      expect(latest).toBeDefined();
      expect(latest!.steps).toBe(8000);
    });

    it('adds a workout to the metric', async () => {
      const latest = await HealthRepository.findLatest(user.id);
      const before = latest!.workouts;
      const updated = await HealthRepository.addWorkout(latest!);
      expect(updated.workouts).toBe(before + 1);
    });
  });

  describe('FinanceRepository', () => {
    it('sums income and expenses and computes a summary', async () => {
      await FinanceRepository.createTransaction({
        userId: user.id,
        title: 'Salary',
        amount: 5000,
        type: 'income',
        category: 'salary',
      });
      await FinanceRepository.createTransaction({
        userId: user.id,
        title: 'Rent',
        amount: 1500,
        type: 'expense',
        category: 'housing',
      });

      const summary = await FinanceRepository.summary(user.id);
      expect(summary.income).toBe(5000);
      expect(summary.expenses).toBe(1500);
      expect(summary.balance).toBe(3500);
      expect(summary.budgetUsed).toBe(30);
    });

    it('reads goals and tracks progress', async () => {
      const goal = await FinanceRepository.createGoal({
        userId: user.id,
        title: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        category: 'savings',
      });

      expect(goal.progress).toBe(0);
      expect(goal.remainingAmount).toBe(1000);

      await FinanceRepository.addGoalProgress(goal, 400);
      const refetched = (await FinanceRepository.findGoals(user.id)).find(
        (g) => g.id === goal.id
      )!;
      expect(refetched.currentAmount).toBe(400);
      expect(refetched.progress).toBeCloseTo(0.4);
    });

    it('lists transactions newest first', async () => {
      const txs = await FinanceRepository.findTransactions(user.id);
      expect(txs.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < txs.length; i++) {
        expect(txs[i - 1].date).toBeGreaterThanOrEqual(txs[i].date);
      }
    });
  });

  describe('AIRepository', () => {
    it('persists and reads chat messages in order', async () => {
      await AIRepository.createMany([
        { userId: user.id, sessionId: 's1', role: 'user', content: 'first' },
        { userId: user.id, sessionId: 's1', role: 'assistant', content: 'second' },
      ]);

      const messages = await AIRepository.findBySession(user.id, 's1');
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('first');
      expect(messages[0].isUser).toBe(true);
      expect(messages[1].isAssistant).toBe(true);
    });

    it('keeps sessions isolated', async () => {
      await AIRepository.create({
        userId: user.id,
        sessionId: 's2',
        role: 'user',
        content: 'other session',
      });

      const s1 = await AIRepository.findBySession(user.id, 's1');
      const s2 = await AIRepository.findBySession(user.id, 's2');
      expect(s1.some((m) => m.content === 'other session')).toBe(false);
      expect(s2).toHaveLength(1);
    });

    it('clears history for a session', async () => {
      await AIRepository.clearHistory(user.id);
      const messages = await AIRepository.findByUser(user.id);
      expect(messages).toHaveLength(0);
    });
  });

  describe('HabitRepository', () => {
    it('creates a habit and completes it with a streak', async () => {
      const habit = await HabitRepository.create({
        userId: user.id,
        title: 'Read Daily',
        category: 'general',
        frequency: 'daily',
        xpReward: 25,
      });

      expect(habit.currentStreak).toBe(0);

      await HabitRepository.complete(habit);
      const refetched = (await HabitRepository.findActive(user.id)).find(
        (h) => h.id === habit.id
      )!;
      expect(refetched.currentStreak).toBe(1);
      expect(refetched.bestStreak).toBe(1);
    });

    it('records a habit entry for the completion', async () => {
      const habits = await HabitRepository.findActive(user.id);
      const habit = habits[habits.length - 1];
      const entries = await HabitRepository.findEntriesByHabit(habit.id);
      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries[0].completed).toBe(true);
    });
  });

  describe('SettingsRepository', () => {
    it('round-trips a value through the settings table', async () => {      await SettingsRepository.setValue({
        userId: user.id,
        key: 'test_key',
        value: { enabled: true, count: 3 },
        category: 'general',
      });

      const read = await SettingsRepository.getValue(user.id, 'test_key');
      expect(read).toEqual({ enabled: true, count: 3 });
    });

    it('updates an existing key rather than duplicating', async () => {
      await SettingsRepository.setValue({
        userId: user.id,
        key: 'test_key',
        value: 'updated',
        category: 'general',
      });

      const all = await SettingsRepository.findByUser(user.id);
      const matching = all.filter((s) => s.key === 'test_key');
      expect(matching).toHaveLength(1);
      expect(await SettingsRepository.getValue(user.id, 'test_key')).toBe('updated');
    });

    it('returns the fallback for a missing key', async () => {
      const value = await SettingsRepository.getValue(user.id, 'nope', 'fallback');
      expect(value).toBe('fallback');
    });

    it('removes a key', async () => {
      await SettingsRepository.remove(user.id, 'test_key');
      const all = await SettingsRepository.findByUser(user.id);
      expect(all.some((s) => s.key === 'test_key')).toBe(false);
    });
  });

  describe('deleteUserCascade', () => {
    it('removes the user and every record scoped to them', async () => {
      const doomed = await UserRepository.create({ deviceId: 'cascade-device', name: 'Doomed' });

      await TaskRepository.create({
        userId: doomed.id,
        title: 'Cascade Task',
        category: 'work',
        priority: 'low',
      });
      await HabitRepository.create({
        userId: doomed.id,
        title: 'Cascade Habit',
        category: 'general',
        frequency: 'daily',
      });
      await HealthRepository.upsertToday(doomed.id, {
        steps: 100,
        stepsGoal: 1000,
        calories: 0,
        sleepHours: 0,
        heartRate: 0,
        workouts: 0,
      });
      await FinanceRepository.createTransaction({
        userId: doomed.id,
        title: 'Cascade Tx',
        amount: 10,
        type: 'income',
        category: 'other',
      });
      await AIRepository.create({
        userId: doomed.id,
        sessionId: 'default',
        role: 'user',
        content: 'cascade message',
      });
      await SettingsRepository.setValue({
        userId: doomed.id,
        key: 'k',
        value: 'v',
      });

      // Seed a second user whose data must survive.
      const survivor = await UserRepository.create({ deviceId: 'survivor-device', name: 'Survivor' });
      await TaskRepository.create({
        userId: survivor.id,
        title: 'Survivor Task',
        category: 'work',
        priority: 'low',
      });

      const deleted = await database.write(() => deleteUserCascade(doomed.id));
      expect(deleted).toBeGreaterThanOrEqual(7);

      expect(await UserRepository.findByDeviceId('cascade-device')).toBeUndefined();
      expect(await TaskRepository.findByUser(doomed.id)).toHaveLength(0);
      expect(await HabitRepository.findActive(doomed.id)).toHaveLength(0);
      expect(await HealthRepository.findByUser(doomed.id)).toHaveLength(0);
      expect(await FinanceRepository.findTransactions(doomed.id)).toHaveLength(0);
      expect(await AIRepository.findByUser(doomed.id)).toHaveLength(0);
      expect(await SettingsRepository.findByUser(doomed.id)).toHaveLength(0);

      // The other user's data is untouched.
      expect(await UserRepository.findByDeviceId('survivor-device')).toBeDefined();
      expect((await TaskRepository.findByUser(survivor.id)).length).toBe(1);
    });
  });
});