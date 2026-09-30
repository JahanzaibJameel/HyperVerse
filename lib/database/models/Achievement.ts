import { Model } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class Achievement extends Model {
  static table = 'achievements';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('description') description!: string;
  @field('category') category!: 'task' | 'habit' | 'health' | 'finance' | 'social';
  @field('badge_icon') badgeIcon!: string;
  @field('xp_reward') xpReward!: number;
  @field('unlocked_at') unlockedAt!: number;
  @readonly @date('created_at') createdAt!: number;

  @relation('achievements', 'user_id') user!: User;

  get isTask(): boolean {
    return this.category === 'task';
  }

  get isHabit(): boolean {
    return this.category === 'habit';
  }

  get isHealth(): boolean {
    return this.category === 'health';
  }

  get isFinance(): boolean {
    return this.category === 'finance';
  }

  get isSocial(): boolean {
    return this.category === 'social';
  }

  static async unlock(
    database: Database,
    userId: string,
    title: string,
    description: string,
    category: Achievement['category'],
    badgeIcon: string,
    xpReward: number
  ): Promise<Achievement> {
    return database.write(async () => {
      return database.get<Achievement>('achievements').create((achievement) => {
        achievement.userId = userId;
        achievement.title = title;
        achievement.description = description;
        achievement.category = category;
        achievement.badgeIcon = badgeIcon;
        achievement.xpReward = xpReward;
        achievement.unlockedAt = Date.now();
      });
    });
  }
}