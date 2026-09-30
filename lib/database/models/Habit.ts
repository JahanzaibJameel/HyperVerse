import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation, children } from '@nozbe/watermelondb/decorators';

import { User } from './User';
import { HabitEntry } from './HabitEntry';

export class Habit extends Model {
  static table = 'habits';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
    entries: { type: 'has_many' as const, foreignKey: 'habit_id' },
  };

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('category') category!: string;
  @field('frequency') frequency!: 'daily' | 'weekly' | 'monthly';
  @field('target_count') targetCount!: number;
  @field('current_streak') currentStreak!: number;
  @field('best_streak') bestStreak!: number;
  @field('xp_reward') xpReward!: number;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;

  @relation('habits', 'user_id') user!: User;
  @children('entries') entries!: HabitEntry[];

  get isDaily(): boolean {
    return this.frequency === 'daily';
  }

  get isWeekly(): boolean {
    return this.frequency === 'weekly';
  }

  get isMonthly(): boolean {
    return this.frequency === 'monthly';
  }

  async complete(): Promise<void> {
    await this.update((habit) => {
      habit.currentStreak += 1;
      if (habit.currentStreak > habit.bestStreak) {
        habit.bestStreak = habit.currentStreak;
      }
    });
  }

  async miss(): Promise<void> {
    await this.update((habit) => {
      habit.currentStreak = 0;
    });
  }

  async updateProgress(increment: boolean = true): Promise<void> {
    await this.update((habit) => {
      if (increment) {
        habit.currentStreak += 1;
        if (habit.currentStreak > habit.bestStreak) {
          habit.bestStreak = habit.currentStreak;
        }
      } else {
        habit.currentStreak = Math.max(0, habit.currentStreak - 1);
      }
    });
  }

  async deactivate(): Promise<void> {
    await this.update((habit) => {
      habit.isActive = false;
    });
  }

  async activate(): Promise<void> {
    await this.update((habit) => {
      habit.isActive = true;
    });
  }
}