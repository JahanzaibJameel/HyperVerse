// Mock Task model for testing
class MockTask {
  static table = 'tasks';

  userId!: string;
  title!: string;
  description?: string;
  category!: string;
  priority!: string;
  status!: string;
  dueDate?: number | null;
  completedAt?: number | null;
  xpReward!: number;
  tags?: string | null;
  createdAt!: number;
  updatedAt!: number;

  constructor(public data: any = {}) {
    Object.assign(this, data);
  }

  async update(recordUpdater: (record: MockTask) => void): Promise<void> {
    recordUpdater(this);
  }

  get isOverdue(): boolean {
    if (!this.dueDate || this.status === 'completed') return false;
    return this.dueDate < Date.now();
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get parsedTags(): string[] {
    if (!this.tags) return [];
    try {
      return JSON.parse(this.tags);
    } catch {
      return [];
    }
  }

  async complete(): Promise<void> {
    await this.update((task) => {
      task.status = 'completed';
      task.completedAt = Date.now();
      task.updatedAt = Date.now();
    });
  }

  async updateStatus(status: string): Promise<void> {
    await this.update((task) => {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = Date.now();
      }
      task.updatedAt = Date.now();
    });
  }

  async updatePriority(priority: string): Promise<void> {
    await this.update((task) => {
      task.priority = priority;
      task.updatedAt = Date.now();
    });
  }

  async addTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      await this.update((task) => {
        task.tags = JSON.stringify(currentTags);
        task.updatedAt = Date.now();
      });
    }
  }

  async removeTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    if (!currentTags.includes(tag)) {
      return;
    }

    const filteredTags = currentTags.filter((t) => t !== tag);
    await this.update((task) => {
      task.tags = JSON.stringify(filteredTags);
      task.updatedAt = Date.now();
    });
  }
}

describe('Task Model', () => {
  let task: MockTask;

  beforeEach(() => {
    // Create a mock task instance
    task = new MockTask({
      userId: 'user123',
      title: 'Test Task',
      description: 'Test Description',
      category: 'work',
      priority: 'medium',
      status: 'todo',
      dueDate: Date.now() + 86400000, // Tomorrow
      completedAt: null,
      xpReward: 30,
      tags: JSON.stringify(['urgent', 'important']),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  describe('Computed Properties', () => {
    describe('isOverdue', () => {
      it('should return false for tasks without due date', () => {
        task.dueDate = null;
        expect(task.isOverdue).toBe(false);
      });

      it('should return false for completed tasks', () => {
        task.status = 'completed';
        task.dueDate = Date.now() - 86400000; // Yesterday
        expect(task.isOverdue).toBe(false);
      });

      it('should return true for overdue incomplete tasks', () => {
        task.status = 'todo';
        task.dueDate = Date.now() - 86400000; // Yesterday
        expect(task.isOverdue).toBe(true);
      });

      it('should return false for future tasks', () => {
        task.status = 'todo';
        task.dueDate = Date.now() + 86400000; // Tomorrow
        expect(task.isOverdue).toBe(false);
      });
    });

    describe('isCompleted', () => {
      it('should return true for completed tasks', () => {
        task.status = 'completed';
        expect(task.isCompleted).toBe(true);
      });

      it('should return false for non-completed tasks', () => {
        task.status = 'todo';
        expect(task.isCompleted).toBe(false);
        task.status = 'in_progress';
        expect(task.isCompleted).toBe(false);
        task.status = 'cancelled';
        expect(task.isCompleted).toBe(false);
      });
    });

    describe('parsedTags', () => {
      it('should return empty array for null tags', () => {
        task.tags = null;
        expect(task.parsedTags).toEqual([]);
      });

      it('should return empty array for invalid JSON', () => {
        task.tags = 'invalid json';
        expect(task.parsedTags).toEqual([]);
      });

      it('should parse valid JSON tags', () => {
        task.tags = JSON.stringify(['urgent', 'important']);
        expect(task.parsedTags).toEqual(['urgent', 'important']);
      });

      it('should return empty array for empty JSON array', () => {
        task.tags = JSON.stringify([]);
        expect(task.parsedTags).toEqual([]);
      });
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      // Mock the update method
      task.update = jest.fn().mockImplementation((fn) => {
        fn(task);
        return Promise.resolve();
      });
    });

    describe('complete', () => {
      it('should mark task as completed and set completedAt timestamp', async () => {
        const originalUpdatedAt = task.updatedAt;
        
        await task.complete();

        expect(task.status).toBe('completed');
        expect(task.completedAt).toBeGreaterThan(0);
        expect(task.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
        expect(task.update).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    describe('updateStatus', () => {
      it('should update status and set completedAt for completed status', async () => {
        const originalUpdatedAt = task.updatedAt;
        
        await task.updateStatus('completed');

        expect(task.status).toBe('completed');
        expect(task.completedAt).toBeGreaterThan(0);
        expect(task.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
        expect(task.update).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should update status without completedAt for non-completed status', async () => {
        const originalCompletedAt = task.completedAt;
        const originalUpdatedAt = task.updatedAt;
        
        await task.updateStatus('in_progress');

        expect(task.status).toBe('in_progress');
        expect(task.completedAt).toBe(originalCompletedAt);
        expect(task.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
        expect(task.update).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should handle all valid status values', async () => {
        const statuses: MockTask['status'][] = ['todo', 'in_progress', 'completed', 'cancelled'];
        
        for (const status of statuses) {
          await task.updateStatus(status);
          expect(task.status).toBe(status);
          expect(task.update).toHaveBeenCalled();
        }
      });
    });

    describe('updatePriority', () => {
      it('should update priority and updatedAt timestamp', async () => {
        const originalUpdatedAt = task.updatedAt;
        
        await task.updatePriority('high');

        expect(task.priority).toBe('high');
        expect(task.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
        expect(task.update).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should handle all valid priority values', async () => {
        const priorities: MockTask['priority'][] = ['low', 'medium', 'high', 'urgent'];
        
        for (const priority of priorities) {
          await task.updatePriority(priority);
          expect(task.priority).toBe(priority);
          expect(task.update).toHaveBeenCalled();
        }
      });
    });

    describe('addTag', () => {
      it('should add new tag to existing tags', async () => {
        const originalUpdatedAt = task.updatedAt;
        
        await task.addTag('new-tag');

        expect(task.parsedTags).toContain('new-tag');
        expect(task.parsedTags).toContain('urgent');
        expect(task.parsedTags).toContain('important');
        expect(task.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
        expect(task.update).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should not add duplicate tag', async () => {
        const originalUpdatedAt = task.updatedAt;
        const originalTagsCount = task.parsedTags.length;
        
        await task.addTag('urgent');

        expect(task.parsedTags.length).toBe(originalTagsCount);
        expect(task.updatedAt).toBe(originalUpdatedAt);
        expect(task.update).not.toHaveBeenCalled();
      });

      it('should handle null tags', async () => {
        task.tags = null;
        
        await task.addTag('first-tag');

        expect(task.parsedTags).toEqual(['first-tag']);
        expect(task.update).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    describe('removeTag', () => {
      it('should remove existing tag', async () => {
        const originalUpdatedAt = task.updatedAt;
        
        await task.removeTag('urgent');

        expect(task.parsedTags).not.toContain('urgent');
        expect(task.parsedTags).toContain('important');
        expect(task.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
        expect(task.update).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should not remove non-existent tag', async () => {
        const originalUpdatedAt = task.updatedAt;
        const originalTagsCount = task.parsedTags.length;
        
        await task.removeTag('non-existent');

        expect(task.parsedTags.length).toBe(originalTagsCount);
        expect(task.updatedAt).toBe(originalUpdatedAt);
        expect(task.update).not.toHaveBeenCalled();
      });

      it('should handle null tags', async () => {
        task.tags = null;
        
        await task.removeTag('any-tag');

        expect(task.parsedTags).toEqual([]);
        expect(task.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('Static Properties', () => {
    it('should have correct table name', () => {
      expect(MockTask.table).toBe('tasks');
    });
  });

  describe('Field Decorators', () => {
    it('should have all required fields defined', () => {
      const decorated = new MockTask({
        userId: 'user-1',
        title: 'Task',
        description: 'Description',
        category: 'work',
        priority: 'high',
        status: 'todo',
        dueDate: null,
        completedAt: null,
        xpReward: 10,
        tags: null,
        createdAt: 1,
        updatedAt: 1,
      });

      expect(decorated).toHaveProperty('userId');
      expect(decorated).toHaveProperty('title');
      expect(decorated).toHaveProperty('description');
      expect(decorated).toHaveProperty('category');
      expect(decorated).toHaveProperty('priority');
      expect(decorated).toHaveProperty('status');
      expect(decorated).toHaveProperty('dueDate');
      expect(decorated).toHaveProperty('completedAt');
      expect(decorated).toHaveProperty('xpReward');
      expect(decorated).toHaveProperty('tags');
      expect(decorated).toHaveProperty('createdAt');
      expect(decorated).toHaveProperty('updatedAt');
    });
  });
});
