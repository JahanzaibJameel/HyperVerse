import { Model } from '@nozbe/watermelondb';
import type { Query } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

import { Task } from './Task';
import { Habit } from './Habit';
import { HabitEntry } from './HabitEntry';
import { HealthMetric } from './HealthMetric';
import { Transaction } from './Transaction';
import { FinancialGoal } from './FinancialGoal';
import { Note } from './Note';
import { Event } from './Event';
import { AIMessage } from './AIMessage';
import { Achievement } from './Achievement';
import { Setting } from './Setting';

export class User extends Model {
  static table = 'users';

  static associations = {
    tasks: { type: 'has_many' as const, foreignKey: 'user_id' },
    habits: { type: 'has_many' as const, foreignKey: 'user_id' },
    habit_entries: { type: 'has_many' as const, foreignKey: 'user_id' },
    health_metrics: { type: 'has_many' as const, foreignKey: 'user_id' },
    transactions: { type: 'has_many' as const, foreignKey: 'user_id' },
    financial_goals: { type: 'has_many' as const, foreignKey: 'user_id' },
    notes: { type: 'has_many' as const, foreignKey: 'user_id' },
    events: { type: 'has_many' as const, foreignKey: 'user_id' },
    ai_messages: { type: 'has_many' as const, foreignKey: 'user_id' },
    achievements: { type: 'has_many' as const, foreignKey: 'user_id' },
    settings: { type: 'has_many' as const, foreignKey: 'user_id' },
  };

  @field('device_id') deviceId!: string;
  @field('name') name!: string;
  @field('email') email!: string | null;
  @field('avatar_url') avatarUrl!: string | null;
  @field('level') level!: number;
  @field('xp') xp!: number;
  @field('xp_to_next_level') xpToNextLevel!: number;
  @field('streak') streak!: number;
  @field('tokens') tokens!: number;
  @field('nfts') nfts!: number;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;

  @children('tasks') tasks!: Query<Task>;
  @children('habits') habits!: Query<Habit>;
  @children('habit_entries') habitEntries!: Query<HabitEntry>;
  @children('health_metrics') healthMetrics!: Query<HealthMetric>;
  @children('transactions') transactions!: Query<Transaction>;
  @children('financial_goals') financialGoals!: Query<FinancialGoal>;
  @children('notes') notes!: Query<Note>;
  @children('events') events!: Query<Event>;
  @children('ai_messages') aiMessages!: Query<AIMessage>;
  @children('achievements') achievements!: Query<Achievement>;
  @children('settings') settings!: Query<Setting>;

  // Computed properties
  get progressToNextLevel(): number {
    return this.xp / this.xpToNextLevel;
  }

  get remainingXP(): number {
    return this.xpToNextLevel - this.xp;
  }

  // Helper methods
  async addXP(amount: number): Promise<void> {
    let newXP = this.xp + amount;
    let newLevel = this.level;
    let newXPToNext = this.xpToNextLevel;

    // `while` so a large XP award can cross several levels in one call, with the
    // threshold growing 1.5x each level and carrying the overflow forward.
    while (newXP >= newXPToNext) {
      newLevel += 1;
      newXP -= newXPToNext;
      newXPToNext = Math.floor(newXPToNext * 1.5);
    }

    await this.update((user) => {
      user.xp = newXP;
      user.level = newLevel;
      user.xpToNextLevel = newXPToNext;
    });
  }

  async updateStreak(increment: boolean = true): Promise<void> {
    const newStreak = increment ? this.streak + 1 : Math.max(0, this.streak - 1);
    await this.update((user) => {
      user.streak = newStreak;
    });
  }

  async updateProfile(data: Partial<Pick<User, 'name' | 'email' | 'avatarUrl'>>): Promise<void> {
    await this.update((user: any) => {
      if (data.name !== undefined) user.name = data.name;
      if (data.email !== undefined) user.email = data.email;
      if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    });
  }
}