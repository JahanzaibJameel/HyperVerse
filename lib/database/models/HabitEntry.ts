import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';
import { Habit } from './Habit';

export class HabitEntry extends Model {
  static table = 'habit_entries';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
    habit: { type: 'belongs_to' as const, key: 'habit_id' },
  };

  @field('habit_id') habitId!: string;
  @field('user_id') userId!: string;
  @field('date') date!: number;
  @field('completed') completed!: boolean;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: number;

  @relation('habit_entries', 'habit_id') habit!: Habit;
  @relation('habit_entries', 'user_id') user!: User;

  async toggleComplete(): Promise<void> {
    await this.update((entry) => {
      entry.completed = !entry.completed;
    });
  }

  async updateNotes(notes: string | null): Promise<void> {
    await this.update((entry) => {
      entry.notes = notes;
    });
  }
}