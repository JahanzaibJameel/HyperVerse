import { Q } from '@nozbe/watermelondb';

import { database, whenDatabaseReady } from '@/lib/database/database';
import { User } from '@/lib/database/models/User';
import { Task } from '@/lib/database/models/Task';

const DEVICE_ID = 'test-device-123';

async function findUserByDeviceId(): Promise<User | undefined> {
  const users = await database
    .get<User>('users')
    .query(Q.where('device_id', DEVICE_ID))
    .fetch();
  return users[0];
}

describe('Database Smoke Test', () => {
  beforeAll(async () => {
    await whenDatabaseReady();
  });

  it('should create and read a user record', async () => {
    const user = await database.write(async () =>
      database.get<User>('users').create((u) => {
        u.deviceId = DEVICE_ID;
        u.name = 'Test User';
        u.email = 'test@example.com';
        u.avatarUrl = null;
        u.level = 1;
        u.xp = 0;
        u.xpToNextLevel = 1000;
        u.streak = 0;
        u.tokens = 100;
        u.nfts = 0;
        u.isActive = true;
      })
    );

    expect(user.id).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.level).toBe(1);
    expect(user.xp).toBe(0);
    expect(user.isActive).toBe(true);
  });

  it('should create and read a task record', async () => {
    const user = await findUserByDeviceId();
    expect(user).toBeDefined();

    const task = await database.write(async () =>
      database.get<Task>('tasks').create((t) => {
        t.userId = user!.id;
        t.title = 'Test Task';
        t.description = 'Test Description';
        t.category = 'test';
        t.priority = 'high';
        t.status = 'todo';
        t.dueDate = null;
        t.completedAt = null;
        t.xpReward = 50;
        t.tags = JSON.stringify(['test', 'smoke']);
      })
    );

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test Task');
    expect(task.priority).toBe('high');
    expect(task.status).toBe('todo');
    expect(task.parsedTags).toEqual(['test', 'smoke']);
  });

  it('should query tasks for user via relation', async () => {
    const user = await findUserByDeviceId();
    expect(user).toBeDefined();

    const tasks = await user!.tasks.fetch();
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    expect(tasks[0].title).toBe('Test Task');
  });

  it('should update user XP and level up', async () => {
    const user = await findUserByDeviceId();
    expect(user).toBeDefined();

    const initialXP = user!.xp;
    const initialLevel = user!.level;

    // Model helpers that call `update()` must run inside a writer block.
    await database.write(async () => {
      await user!.addXP(1500);
    });

    const updatedUser = await database.get<User>('users').find(user!.id);
    expect(updatedUser.xp).toBe(initialXP + 1500 - 1000);
    expect(updatedUser.level).toBe(initialLevel + 1);
  });

  it('should complete task and update status', async () => {
    const tasks = await database
      .get<Task>('tasks')
      .query(Q.where('title', 'Test Task'))
      .fetch();
    const task = tasks[0];

    expect(task).toBeDefined();
    expect(task!.status).toBe('todo');

    await database.write(async () => {
      await task!.complete();
    });

    const updatedTask = await database.get<Task>('tasks').find(task!.id);
    expect(updatedTask.status).toBe('completed');
    expect(updatedTask.completedAt).not.toBeNull();
  });
});
