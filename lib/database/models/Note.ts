import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class Note extends Model {
  static table = 'notes';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('content') content!: string;
  @field('type') type!: 'note' | 'journal' | 'idea';
  @field('mood') mood!: string | null;
  @field('tags') tags!: string | null;
  @field('is_private') isPrivate!: boolean;
  @readonly @date('created_at') createdAt!: number;
  @readonly @date('updated_at') updatedAt!: number;

  @relation('users', 'user_id') user!: User;

  get isJournal(): boolean {
    return this.type === 'journal';
  }

  get isIdea(): boolean {
    return this.type === 'idea';
  }

  get parsedTags(): string[] {
    if (!this.tags) return [];
    try {
      return JSON.parse(this.tags);
    } catch {
      return [];
    }
  }

  async updateContent(content: string): Promise<void> {
    await this.update((note) => {
      note.content = content;
    });
  }

  async updateMood(mood: string | null): Promise<void> {
    await this.update((note) => {
      note.mood = mood;
    });
  }

  async addTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      await this.update((note) => {
        note.tags = JSON.stringify(currentTags);
      });
    }
  }

  async removeTag(tag: string): Promise<void> {
    const currentTags = this.parsedTags;
    const filteredTags = currentTags.filter((t) => t !== tag);
    await this.update((note) => {
      note.tags = JSON.stringify(filteredTags);
    });
  }

  async togglePrivate(): Promise<void> {
    await this.update((note) => {
      note.isPrivate = !note.isPrivate;
    });
  }
}