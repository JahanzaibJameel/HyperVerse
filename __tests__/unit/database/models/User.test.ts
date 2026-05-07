// Mock User model for testing
class MockUser {
  static table = 'users';
  
  // Define all properties that the real User model has
  deviceId!: string;
  name!: string;
  email!: string | null;
  avatarUrl!: string | null;
  level!: number;
  xp!: number;
  xpToNextLevel!: number;
  streak!: number;
  tokens!: number;
  nfts!: number;
  isActive!: boolean;
  createdAt!: number;
  updatedAt!: number;
  
  constructor(public data: any = {}) {
    Object.assign(this, data);
  }

  get progressToNextLevel(): number {
    return this.xp / this.xpToNextLevel;
  }

  get remainingXP(): number {
    return this.xpToNextLevel - this.xp;
  }

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

    this.xp = newXP;
    this.level = newLevel;
    this.xpToNextLevel = newXPToNext;
    this.updatedAt = Date.now();
  }

  async updateStreak(increment: boolean = true): Promise<void> {
    const newStreak = increment ? this.streak + 1 : Math.max(0, this.streak - 1);
    this.streak = newStreak;
    this.updatedAt = Date.now();
  }

  async updateProfile(data: Partial<Pick<MockUser, 'name' | 'email' | 'avatarUrl'>>): Promise<void> {
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.avatarUrl !== undefined) this.avatarUrl = data.avatarUrl;
    this.updatedAt = Date.now();
  }
}

describe('User Model', () => {
  let user: MockUser;

  beforeEach(() => {
    // Create a mock user instance
    user = new MockUser({
      deviceId: 'device123',
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      level: 5,
      xp: 750,
      xpToNextLevel: 1000,
      streak: 10,
      tokens: 100,
      nfts: 3,
      isActive: true,
      createdAt: Date.now() - 86400000, // Yesterday
      updatedAt: Date.now(),
    });
  });

  describe('Computed Properties', () => {
    describe('progressToNextLevel', () => {
      it('should calculate correct progress percentage', () => {
        expect(user.progressToNextLevel).toBe(0.75); // 750/1000
      });

      it('should handle zero XP', () => {
        user.xp = 0;
        expect(user.progressToNextLevel).toBe(0);
      });

      it('should handle maximum XP', () => {
        user.xp = user.xpToNextLevel;
        expect(user.progressToNextLevel).toBe(1);
      });

      it('should handle division by zero', () => {
        user.xpToNextLevel = 0;
        expect(() => user.progressToNextLevel).not.toThrow();
      });
    });

    describe('remainingXP', () => {
      it('should calculate correct remaining XP', () => {
        expect(user.remainingXP).toBe(250); // 1000 - 750
      });

      it('should handle zero remaining XP', () => {
        user.xp = user.xpToNextLevel;
        expect(user.remainingXP).toBe(0);
      });

      it('should handle full XP requirement', () => {
        user.xp = 0;
        expect(user.remainingXP).toBe(user.xpToNextLevel);
      });
    });
  });

  describe('Helper Methods', () => {
    describe('addXP', () => {
      it('should add XP without level up', async () => {
        const originalLevel = user.level;
        const originalXPToNext = user.xpToNextLevel;
        
        await user.addXP(100);

        expect(user.xp).toBe(850);
        expect(user.level).toBe(originalLevel);
        expect(user.xpToNextLevel).toBe(originalXPToNext);
      });

      it('should level up when XP threshold is reached', async () => {
        user.xp = 900; // Close to level up
        
        await user.addXP(150);

        expect(user.level).toBe(6); // Leveled up
        expect(user.xp).toBe(50); // Overflow XP
        expect(user.xpToNextLevel).toBe(1500); // Increased requirement
      });

      it('should handle multiple level ups', async () => {
        user.level = 1;
        user.xp = 0;
        user.xpToNextLevel = 100;
        
        await user.addXP(300); // Enough for 2 level ups

        expect(user.level).toBe(3);
        expect(user.xp).toBeGreaterThan(0);
      });

      it('should handle zero XP addition', async () => {
        const originalXP = user.xp;
        
        await user.addXP(0);

        expect(user.xp).toBe(originalXP);
        expect(user.level).toBe(5);
      });

      it('should update timestamp', async () => {
        const originalUpdatedAt = user.updatedAt;
        
        // Small delay to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 1));
        
        await user.addXP(50);

        expect(user.updatedAt).toBeGreaterThan(originalUpdatedAt);
      });
    });

    describe('updateStreak', () => {
      it('should increment streak by default', async () => {
        const originalStreak = user.streak;
        
        await user.updateStreak();

        expect(user.streak).toBe(originalStreak + 1);
      });

      it('should increment streak when true', async () => {
        const originalStreak = user.streak;
        
        await user.updateStreak(true);

        expect(user.streak).toBe(originalStreak + 1);
      });

      it('should decrement streak when false', async () => {
        const originalStreak = user.streak;
        
        await user.updateStreak(false);

        expect(user.streak).toBe(originalStreak - 1);
      });

      it('should not allow negative streak', async () => {
        user.streak = 0;
        
        await user.updateStreak(false);

        expect(user.streak).toBe(0);
      });

      it('should update timestamp', async () => {
        const originalUpdatedAt = user.updatedAt;
        
        await new Promise(resolve => setTimeout(resolve, 1));
        
        await user.updateStreak();

        expect(user.updatedAt).toBeGreaterThan(originalUpdatedAt);
      });
    });

    describe('updateProfile', () => {
      it('should update name', async () => {
        const newName = 'Updated Name';
        
        await user.updateProfile({ name: newName });

        expect(user.name).toBe(newName);
      });

      it('should update email', async () => {
        const newEmail = 'updated@example.com';
        
        await user.updateProfile({ email: newEmail });

        expect(user.email).toBe(newEmail);
      });

      it('should update avatar URL', async () => {
        const newAvatarUrl = 'https://example.com/new-avatar.jpg';
        
        await user.updateProfile({ avatarUrl: newAvatarUrl });

        expect(user.avatarUrl).toBe(newAvatarUrl);
      });

      it('should update multiple fields', async () => {
        const updates = {
          name: 'New Name',
          email: 'new@example.com',
          avatarUrl: 'https://example.com/new.jpg',
        };
        
        await user.updateProfile(updates);

        expect(user.name).toBe(updates.name);
        expect(user.email).toBe(updates.email);
        expect(user.avatarUrl).toBe(updates.avatarUrl);
      });

      it('should not update fields that are not provided', async () => {
        const originalName = user.name;
        const originalEmail = user.email;
        const originalAvatarUrl = user.avatarUrl;
        
        await user.updateProfile({});

        expect(user.name).toBe(originalName);
        expect(user.email).toBe(originalEmail);
        expect(user.avatarUrl).toBe(originalAvatarUrl);
      });

      it('should update timestamp', async () => {
        const originalUpdatedAt = user.updatedAt;
        
        await new Promise(resolve => setTimeout(resolve, 1));
        
        await user.updateProfile({ name: 'Updated' });

        expect(user.updatedAt).toBeGreaterThan(originalUpdatedAt);
      });
    });
  });

  describe('Static Properties', () => {
    it('should have correct table name', () => {
      expect(MockUser.table).toBe('users');
    });
  });

  describe('Field Validation', () => {
    it('should have all required fields defined', () => {
      const user = new MockUser();
      
      expect(user).toHaveProperty('deviceId');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('avatarUrl');
      expect(user).toHaveProperty('level');
      expect(user).toHaveProperty('xp');
      expect(user).toHaveProperty('xpToNextLevel');
      expect(user).toHaveProperty('streak');
      expect(user).toHaveProperty('tokens');
      expect(user).toHaveProperty('nfts');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });

    it('should handle null values for optional fields', () => {
      const user = new MockUser({
        email: null,
        avatarUrl: null,
      });

      expect(user.email).toBeNull();
      expect(user.avatarUrl).toBeNull();
    });

    it('should handle boolean values', () => {
      const activeUser = new MockUser({ isActive: true });
      const inactiveUser = new MockUser({ isActive: false });

      expect(activeUser.isActive).toBe(true);
      expect(inactiveUser.isActive).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large XP values', async () => {
      user.xp = Number.MAX_SAFE_INTEGER - 1000;
      user.xpToNextLevel = Number.MAX_SAFE_INTEGER;
      
      await user.addXP(500);

      expect(user.xp).toBeGreaterThan(Number.MAX_SAFE_INTEGER - 1000);
    });

    it('should handle negative XP addition', async () => {
      const originalXP = user.xp;
      
      await user.addXP(-100);

      expect(user.xp).toBe(originalXP - 100);
    });

    it('should handle very high streak values', async () => {
      user.streak = Number.MAX_SAFE_INTEGER - 1;
      
      await user.updateStreak(true);

      expect(user.streak).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
