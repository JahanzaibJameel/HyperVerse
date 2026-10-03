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
 * Sort clauses for chat reads. These must be spread as separate query arguments;
 * WatermelonDB rejects a nested array as a query clause, so the helper returns an
 * array purely to be spread at the call site.
 *
 * The `created_at` clause carries insertion order. The `id` clause is here for
 * API shape — a deterministic secondary sort key — and must not be mistaken for
 * an ordering guarantee. WatermelonDB ids are random strings, not monotonic
 * counters, so for two messages sharing a `created_at` (a user message and its
 * reply can easily land in the same millisecond) the rows come back in an order
 * derived from those random strings. That is stable within a single result set
 * but not meaningful: it varies by machine and by run.
 *
 * Consequence for callers: do not rely on this function for strict insertion
 * order when timestamps can collide. Either ensure distinct `created_at` values
 * at write time, or sort on a monotonic column.
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