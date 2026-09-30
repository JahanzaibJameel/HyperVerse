import { Q } from '@nozbe/watermelondb';

import { database } from '../database';
import { Setting } from '../models/Setting';

export interface SettingInput {
  userId: string;
  key: string;
  value: any;
  category?: Setting['category'];
}

export const SettingsRepository = {
  async findByUser(userId: string): Promise<Setting[]> {
    return database
      .get<Setting>('settings')
      .query(Q.where('user_id', userId))
      .fetch();
  },

  async findByCategory(userId: string, category: Setting['category']): Promise<Setting[]> {
    return Setting.getSettingsByCategory(database, userId, category);
  },

  async getValue(userId: string, key: string, fallback?: any): Promise<any> {
    const setting = await Setting.getSetting(database, userId, key);
    return setting ? setting.parsedValue : fallback;
  },

  async setValue(input: SettingInput): Promise<Setting> {
    return Setting.setSetting(
      database,
      input.userId,
      input.key,
      input.value,
      input.category ?? 'general'
    );
  },

  async remove(userId: string, key: string): Promise<void> {
    const existing = await Setting.getSetting(database, userId, key);
    if (existing) {
      await database.write(async () => {
        await (existing as unknown as { destroyPermanently: () => Promise<void> }).destroyPermanently();
      });
    }
  },
};