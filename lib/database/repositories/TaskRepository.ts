import { Q } from '@nozbe/watermelondb';

import { database } from '../database';
import type { Task } from '../models/Task';

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskInput {
  userId: string;
  title: string;
  description?: string | null;
  category: string;
  priority: TaskPriority;
  status?: TaskStatus;
  dueDate?: number | null;
  xpReward?: number;
  tags?: string[];
}

export const TaskRepository = {
  async findByUser(userId: string): Promise<Task[]> {
    return database
      .get<Task>('tasks')
      .query(Q.where('user_id', userId), Q.sortBy('created_at', 'desc'))
      .fetch();
  },

  async findCompleted(userId: string): Promise<Task[]> {
    return database
      .get<Task>('tasks')
      .query(
        Q.where('user_id', userId),
        Q.where('status', 'completed'),
        Q.sortBy('completed_at', 'desc')
      )
      .fetch();
  },

  async findOverdue(userId: string): Promise<Task[]> {
    return database
      .get<Task>('tasks')
      .query(
        Q.where('user_id', userId),
        Q.where('status', 'todo'),
        Q.where('due_date', Q.lt(Date.now())),
        Q.sortBy('due_date', 'asc')
      )
      .fetch();
  },

  async findById(id: string): Promise<Task | undefined> {
    try {
      return await database.get<Task>('tasks').find(id);
    } catch {
      return undefined;
    }
  },

  async create(input: TaskInput): Promise<Task> {
    return database.write(async () =>
      database.get<Task>('tasks').create((task) => {
        task.userId = input.userId;
        task.title = input.title;
        task.description = input.description ?? null;
        task.category = input.category;
        task.priority = input.priority;
        task.status = input.status ?? 'todo';
        task.dueDate = input.dueDate ?? null;
        task.completedAt = null;
        task.xpReward = input.xpReward ?? 0;
        task.tags = input.tags ? JSON.stringify(input.tags) : null;
      })
    );
  },

  async update(task: Task, mutator: (task: Task) => void): Promise<Task> {
    return database.write(async () => {
      await task.update(mutator);
      return task;
    });
  },

  async remove(task: Task): Promise<void> {
    await database.write(async () => {
      await (task as unknown as { destroyPermanently: () => Promise<void> }).destroyPermanently();
    });
  },

  async markCompleted(task: Task): Promise<Task> {
    return this.update(task, (t) => {
      t.status = 'completed';
      t.completedAt = Date.now();
    });
  },

  async markInProgress(task: Task): Promise<Task> {
    return this.update(task, (t) => {
      t.status = 'in_progress';
    });
  },
};