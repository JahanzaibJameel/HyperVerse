import { Q } from '@nozbe/watermelondb';

import { database } from '../database';
import { AIMessage } from '../models/AIMessage';

export interface AIMessageInput {
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed?: string;
  contextUsed?: string[];
  tokensUsed?: number;
}

/**
 * Chat order is `created_at` ascending, with `id` as a tiebreaker. A user message
 * and its reply can land in the same millisecond, and `created_at` is the only
 * column carrying order — without a secondary key the sort would be
 * non-deterministic for those pairs. These must be spread as separate query
 * arguments; WatermelonDB rejects a nested array as a query clause.
 */
const orderByCreatedThenId = () => [Q.sortBy('created_at', 'asc'), Q.sortBy('id', 'asc')];

export const AIRepository = {
  async findByUser(userId: string, limit = 100): Promise<AIMessage[]> {
    return database
      .get<AIMessage>('ai_messages')
      .query(Q.where('user_id', userId), ...orderByCreatedThenId(), Q.take(limit))
      .fetch();
  },

  async findBySession(userId: string, sessionId: string, limit = 100): Promise<AIMessage[]> {
    return database
      .get<AIMessage>('ai_messages')
      .query(
        Q.where('user_id', userId),
        Q.where('session_id', sessionId),
        ...orderByCreatedThenId(),
        Q.take(limit)
      )
      .fetch();
  },

  async create(input: AIMessageInput): Promise<AIMessage> {
    return AIMessage.createMessage(
      database,
      input.userId,
      input.sessionId,
      input.role,
      input.content,
      {
        modelUsed: input.modelUsed,
        contextUsed: input.contextUsed,
        tokensUsed: input.tokensUsed,
      }
    );
  },

  async createMany(inputs: AIMessageInput[]): Promise<AIMessage[]> {
    const results: AIMessage[] = [];
    for (const input of inputs) {
      results.push(await this.create(input));
    }
    return results;
  },

  async clearHistory(userId: string): Promise<void> {
    const messages = await this.findByUser(userId, 1000);
    await database.write(async () => {
      for (const msg of messages) {
        await (msg as unknown as { destroyPermanently: () => Promise<void> }).destroyPermanently();
      }
    });
  },
};