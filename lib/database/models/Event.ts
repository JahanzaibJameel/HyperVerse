import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class Event extends Model {
  static table = 'events';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('start_date') startDate!: number;
  @field('end_date') endDate!: number | null;
  @field('location') location!: string | null;
  @field('type') type!: 'meeting' | 'reminder' | 'appointment';
  @field('is_all_day') isAllDay!: boolean;
  @field('reminder_minutes') reminderMinutes!: number | null;
  @field('tags') tags!: string | null;
  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;

  @relation('users', 'user_id') user!: User;

  get isMeeting(): boolean {
    return this.type === 'meeting';
  }

  get isReminder(): boolean {
    return this.type === 'reminder';
  }

  get isAppointment(): boolean {
    return this.type === 'appointment';
  }

  get isUpcoming(): boolean {
    return this.startDate > Date.now();
  }

  get isPast(): boolean {
    const end = this.endDate || this.startDate;
    return end < Date.now();
  }

  get isHappeningNow(): boolean {
    const now = Date.now();
    const start = this.startDate;
    const end = this.endDate || start;
    return start <= now && end >= now;
  }

  get duration(): number {
    if (!this.endDate) return 0;
    return this.endDate - this.startDate;
  }

  get parsedTags(): string[] {
    if (!this.tags) return [];
    try {
      return JSON.parse(this.tags);
    } catch {
      return [];
    }
  }

  async updateTime(startDate: number, endDate?: number): Promise<void> {
    await this.update((event) => {
      event.startDate = startDate;
      if (endDate !== undefined) {
        event.endDate = endDate;
      }
    });
  }

  async updateReminder(minutes: number | null): Promise<void> {
    await this.update((event) => {
      event.reminderMinutes = minutes;
    });
  }

  async addTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      await this.update((event) => {
        event.tags = JSON.stringify(currentTags);
      });
    }
  }

  async removeTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    const filteredTags = currentTags.filter((t) => t !== tag);
    await this.update((event) => {
      event.tags = JSON.stringify(filteredTags);
    });
  }
}