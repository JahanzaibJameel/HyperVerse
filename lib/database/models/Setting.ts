import { Model, Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class Setting extends Model {
  static table = 'settings';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('key') key!: string;
  @field('value') value!: string;
  @field('category') category!: 'theme' | 'notifications' | 'privacy' | 'ai' | 'general';
  @readonly @date('updated_at') updatedAt!: number;

  @relation('users', 'user_id') user!: User;

  get parsedValue(): any {
    try {
      return JSON.parse(this.value);
    } catch {
      return this.value;
    }
  }

  static async getSetting(
    database: Database,
    userId: string,
    key: string
  ): Promise<Setting | null> {
    const settings = await database.get<Setting>('settings')
      .query(Q.where('user_id', userId), Q.where('key', key))
      .fetch();
    return settings[0] || null;
  }

  static async setSetting(
    database: Database,
    userId: string,
    key: string,
    value: any,
    category: Setting['category'] = 'general'
  ): Promise<Setting> {
    const existing = await Setting.getSetting(database, userId, key);
    
    if (existing) {
      return database.write(async () => {
        await existing.update((setting) => {
          setting.value = typeof value === 'string' ? value : JSON.stringify(value);
          setting.category = category;
        });
        return existing;
      });
    }

    return database.write(async () => {
      return database.get<Setting>('settings').create((setting) => {
        setting.userId = userId;
        setting.key = key;
        setting.value = typeof value === 'string' ? value : JSON.stringify(value);
        setting.category = category;
      });
    });
  }

  static async getSettingsByCategory(
    database: Database,
    userId: string,
    category: Setting['category']
  ): Promise<Setting[]> {
    return database.get<Setting>('settings')
      .query(Q.where('user_id', userId), Q.where('category', category))
      .fetch();
  }

  async updateValue(value: any): Promise<void> {
    await this.update((setting) => {
      setting.value = typeof value === 'string' ? value : JSON.stringify(value);
    });
  }
}