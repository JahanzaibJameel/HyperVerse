import { Q } from '@nozbe/watermelondb';

import { database } from '../database';
import type { Habit } from '../models/Habit';
import type { HabitEntry } from '../models/HabitEntry';

export interface HabitInput {
  userId: string;
  title: string;
  description?: string | null;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount?: number;
  xpReward?: number;
}

export interface HabitEntryInput {
  habitId: string;
  userId: string;
  date: number;
  completed: boolean;
  notes?: string | null;
}

export const HabitRepository = {
  async findByUser(userId: string): Promise<Habit[]> {
    return database
      .get<Habit>('habits')
      .query(Q.where('user_id', userId), Q.sortBy('created_at', 'desc'))
      .fetch();
  },

  async findActive(userId: string): Promise<Habit[]> {
    return database
      .get<Habit>('habits')
      .query(
        Q.where('user_id', userId),
        Q.where('is_active', true),
        Q.sortBy('created_at', 'desc')
      )
      .fetch();
  },

  async findById(id: string): Promise<Habit | undefined> {
    try {
      return await database.get<Habit>('habits').find(id);
    } catch {
      return undefined;
    }
  },

  async create(input: HabitInput): Promise<Habit> {
    return database.write(async () =>
      database.get<Habit>('habits').create((habit) => {
        habit.userId = input.userId;
        habit.title = input.title;
        habit.description = input.description ?? null;
        habit.category = input.category;
        habit.frequency = input.frequency;
        habit.targetCount = input.targetCount ?? 1;
        habit.currentStreak = 0;
        habit.bestStreak = 0;
        habit.xpReward = input.xpReward ?? 0;
        habit.isActive = true;
      })
    );
  },

  async complete(habit: Habit, date: number = Date.now()): Promise<Habit> {
    return database.write(async () => {
      await habit.complete();
      await database.get<HabitEntry>('habit_entries').create((entry) => {
        entry.habitId = habit.id;
        entry.userId = habit.userId;
        entry.date = date;
        entry.completed = true;
        entry.notes = null;
      });
      return habit;
    });
  },

  async update(habit: Habit, mutator: (habit: Habit) => void): Promise<Habit> {
    return database.write(async () => {
      await habit.update(mutator);
      return habit;
    });
  },

  async findEntriesByHabit(habitId: string): Promise<HabitEntry[]> {
    return database
      .get<HabitEntry>('habit_entries')
      .query(Q.where('habit_id', habitId), Q.sortBy('date', 'desc'))
      .fetch();
  },

  async findTodaysEntry(habitId: string): Promise<HabitEntry | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayStart = today.getTime();
    const entries = await database
      .get<HabitEntry>('habit_entries')
      .query(Q.where('habit_id', habitId), Q.where('date', dayStart))
      .fetch();
    return entries[0];
  },
};