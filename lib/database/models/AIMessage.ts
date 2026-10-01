import { Model } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class AIMessage extends Model {
  static table = 'ai_messages';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('session_id') sessionId!: string;
  @field('role') role!: 'user' | 'assistant' | 'system';
  @field('content') content!: string;
  @field('model_used') modelUsed!: string | null;
  @field('context_used') contextUsed!: string | null;
  @field('tokens_used') tokensUsed!: number | null;
  @readonly @date('created_at') createdAt!: number;

  @relation('users', 'user_id') user!: User;

  get isUser(): boolean {
    return this.role === 'user';
  }

  get isAssistant(): boolean {
    return this.role === 'assistant';
  }

  get isSystem(): boolean {
    return this.role === 'system';
  }

  get parsedContextUsed(): string[] {
    if (!this.contextUsed) return [];
    try {
      return JSON.parse(this.contextUsed);
    } catch {
      return [];
    }
  }

  static async createMessage(
    database: Database,
    userId: string,
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    options?: {
      modelUsed?: string;
      contextUsed?: string[];
      tokensUsed?: number;
    }
  ): Promise<AIMessage> {
    return database.write(async () => {
      return database.get<AIMessage>('ai_messages').create((msg) => {
        msg.userId = userId;
        msg.sessionId = sessionId;
        msg.role = role;
        msg.content = content;
        msg.modelUsed = options?.modelUsed || null;
        msg.contextUsed = options?.contextUsed ? JSON.stringify(options.contextUsed) : null;
        msg.tokensUsed = options?.tokensUsed || null;
      });
    });
  }
}