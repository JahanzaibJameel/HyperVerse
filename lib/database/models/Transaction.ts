import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class Transaction extends Model {
  static table = 'transactions';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('amount') amount!: number;
  @field('type') type!: 'income' | 'expense' | 'transfer';
  @field('category') category!: string;
  @field('date') date!: number;
  @field('tags') tags!: string | null;
  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;

  @relation('transactions', 'user_id') user!: User;

  get isIncome(): boolean {
    return this.type === 'income';
  }

  get isExpense(): boolean {
    return this.type === 'expense';
  }

  get isTransfer(): boolean {
    return this.type === 'transfer';
  }

  get signedAmount(): number {
    return this.isIncome ? this.amount : -this.amount;
  }

  get parsedTags(): string[] {
    if (!this.tags) return [];
    try {
      return JSON.parse(this.tags);
    } catch {
      return [];
    }
  }

  async updateAmount(amount: number): Promise<void> {
    await this.update((transaction) => {
      transaction.amount = amount;
    });
  }

  async updateCategory(category: string): Promise<void> {
    await this.update((transaction) => {
      transaction.category = category;
    });
  }

  async addTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      await this.update((transaction) => {
        transaction.tags = JSON.stringify(currentTags);
      });
    }
  }

  async removeTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    const filteredTags = currentTags.filter((t) => t !== tag);
    await this.update((transaction) => {
      transaction.tags = JSON.stringify(filteredTags);
    });
  }
}