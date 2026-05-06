import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class User extends Model {
  static table = 'users';

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

  // Computed properties
  get progressToNextLevel(): number {
    return this.xp / this.xpToNextLevel;
  }

  get remainingXP(): number {
    return this.xpToNextLevel - this.xp;
  }

  // Helper methods
  async addXP(amount: number): Promise<void> {
    const newXP = this.xp + amount;
    let newLevel = this.level;
    let newXPToNext = this.xpToNextLevel;

    // Level up logic
    if (newXP >= this.xpToNextLevel) {
      newLevel += 1;
      const overflowXP = newXP - this.xpToNextLevel;
      newXPToNext = Math.floor(this.xpToNextLevel * 1.5); // Increase XP requirement
      newXP = overflowXP;
    }

    await this.update((user) => {
      user.xp = newXP;
      user.level = newLevel;
      user.xpToNextLevel = newXPToNext;
      user.updatedAt = Date.now();
    });
  }

  async updateStreak(increment: boolean = true): Promise<void> {
    const newStreak = increment ? this.streak + 1 : Math.max(0, this.streak - 1);
    await this.update((user) => {
      user.streak = newStreak;
      user.updatedAt = Date.now();
    });
  }

  async updateProfile(data: Partial<Pick<User, 'name' | 'email' | 'avatarUrl'>>): Promise<void> {
    await this.update((user: any) => {
      if (data.name !== undefined) user.name = data.name;
      if (data.email !== undefined) user.email = data.email;
      if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
      user.updatedAt = Date.now();
    });
  }
}
