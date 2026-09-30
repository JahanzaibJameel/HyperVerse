import { Q } from '@nozbe/watermelondb';

import { database } from '../database';
import type { User } from '../models/User';

/**
 * User repository — creates and reads the `users` row for a device.
 *
 * The onboarding flow in `app/(auth)/setup.tsx` creates a SecureStore profile via
 * `AuthService`. This repository is responsible for the matching `users` row in
 * SQLite so the rest of the app can query domain data scoped to that user.
 */
export const UserRepository = {
  async findByDeviceId(deviceId: string): Promise<User | undefined> {
    const users = await database
      .get<User>('users')
      .query(Q.where('device_id', deviceId))
      .fetch();
    return users[0];
  },

  async findById(id: string): Promise<User | undefined> {
    try {
      return await database.get<User>('users').find(id);
    } catch {
      return undefined;
    }
  },

  async create(profile: {
    deviceId: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
    level?: number;
    xp?: number;
    xpToNextLevel?: number;
    streak?: number;
    tokens?: number;
    nfts?: number;
    isActive?: boolean;
  }): Promise<User> {
    return database.write(async () =>
      database.get<User>('users').create((user) => {
        user.deviceId = profile.deviceId;
        user.name = profile.name;
        user.email = profile.email ?? null;
        user.avatarUrl = profile.avatarUrl ?? null;
        user.level = profile.level ?? 1;
        user.xp = profile.xp ?? 0;
        user.xpToNextLevel = profile.xpToNextLevel ?? 1000;
        user.streak = profile.streak ?? 0;
        user.tokens = profile.tokens ?? 100;
        user.nfts = profile.nfts ?? 0;
        user.isActive = profile.isActive ?? true;
      })
    );
  },

  async upsertFromProfile(profile: {
    deviceId: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
    level?: number;
    xp?: number;
    xpToNextLevel?: number;
    streak?: number;
    tokens?: number;
    nfts?: number;
    isActive?: boolean;
  }): Promise<User> {
    const existing = await this.findByDeviceId(profile.deviceId);
    if (existing) {
      return database.write(async () => {
        await existing.update((user) => {
          user.name = profile.name;
          user.email = profile.email ?? null;
          user.avatarUrl = profile.avatarUrl ?? null;
          user.level = profile.level ?? user.level;
          user.xp = profile.xp ?? user.xp;
          user.xpToNextLevel = profile.xpToNextLevel ?? user.xpToNextLevel;
          user.streak = profile.streak ?? user.streak;
          user.tokens = profile.tokens ?? user.tokens;
          user.nfts = profile.nfts ?? user.nfts;
          user.isActive = profile.isActive ?? user.isActive;
        });
        return existing;
      });
    }
    return this.create(profile);
  },
};