import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class FinancialGoal extends Model {
  static table = 'financial_goals';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('target_amount') targetAmount!: number;
  @field('current_amount') currentAmount!: number;
  @field('target_date') targetDate!: number | null;
  @field('category') category!: string;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;

  @relation('users', 'user_id') user!: User;

  get progress(): number {
    return this.targetAmount > 0 ? this.currentAmount / this.targetAmount : 0;
  }

  get remainingAmount(): number {
    return Math.max(0, this.targetAmount - this.currentAmount);
  }

  get isCompleted(): boolean {
    return this.currentAmount >= this.targetAmount;
  }

  get isOverdue(): boolean {
    if (!this.targetDate) return false;
    return this.targetDate < Date.now() && !this.isCompleted;
  }

  async addProgress(amount: number): Promise<void> {
    await this.update((goal) => {
      goal.currentAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
    });
  }

  async setProgress(amount: number): Promise<void> {
    await this.update((goal) => {
      goal.currentAmount = Math.max(0, Math.min(goal.targetAmount, amount));
    });
  }

  async complete(): Promise<void> {
    await this.update((goal) => {
      goal.currentAmount = goal.targetAmount;
      goal.isActive = false;
    });
  }

  async deactivate(): Promise<void> {
    await this.update((goal) => {
      goal.isActive = false;
    });
  }

  async activate(): Promise<void> {
    await this.update((goal) => {
      goal.isActive = true;
    });
  }
}