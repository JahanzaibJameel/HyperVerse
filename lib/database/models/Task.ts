import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class Task extends Model {
  static table = 'tasks';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('category') category!: string;
  @field('priority') priority!: 'low' | 'medium' | 'high' | 'urgent';
  @field('status') status!: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  @field('due_date') dueDate!: number | null;
  @field('completed_at') completedAt!: number | null;
  @field('xp_reward') xpReward!: number;
  @field('tags') tags!: string | null;
  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;

  @relation('tasks', 'user_id') user!: User;

  // Computed properties
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

  // Helper methods
  async complete(): Promise<void> {
    await this.update((task) => {
      task.status = 'completed';
      task.completedAt = Date.now();
    });
  }

  async updateStatus(status: Task['status']): Promise<void> {
    await this.update((task) => {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = Date.now();
      }
    });
  }

  async updatePriority(priority: Task['priority']): Promise<void> {
    await this.update((task) => {
      task.priority = priority;
    });
  }

  async addTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      await this.update((task) => {
        task.tags = JSON.stringify(currentTags);
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
    });
  }
}