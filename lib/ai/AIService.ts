import ModelManager, { AIModel } from './models/ModelManager';
import VectorStore, { SearchResult } from './rag/VectorStore';
import { buildSnapshot, applyUserProfile } from './insights/snapshotBuilder';
import { generateInsight } from './insights/InsightEngine';
import type { UserSnapshot } from './insights/types';

export type GenerationBackend = 'model' | 'local';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  contextUsed?: string[];
  tokensUsed?: number;
}

export interface AIResponse {
  message: ChatMessage;
  context: SearchResult[];
  modelUsed: string;
  tokensUsed: number;
  processingTime: number;
  /** Which engine produced the text: a downloaded model, or the local engine. */
  backend: GenerationBackend;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  messages: ChatMessage[];
  relevantDocuments: SearchResult[];
}

class AIService {
  private static instance: AIService;
  private modelManager: ModelManager;
  private vectorStore: VectorStore;
  private conversations: Map<string, ConversationContext> = new Map();

  private constructor() {
    this.modelManager = ModelManager.getInstance();
    this.vectorStore = VectorStore.getInstance();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async initialize(): Promise<void> {
    await this.vectorStore.initialize();
    console.log('AI Service initialized');
  }

  /**
   * True when a downloadable LLM has been fetched and activated. When false the
   * service answers from the local insight engine, which needs no model files.
   */
  hasActiveModel(): boolean {
    const active = this.modelManager.getActiveModel();
    return !!active && active.type === 'llm' && !!this.modelManager.getActivePipeline();
  }

  async sendMessage(
    message: string,
    sessionId: string = 'default',
    user: { id: string; name?: string; level?: number; streak?: number },
    options: {
      includeContext?: boolean;
      contextTypes?: string[];
      maxContextDocuments?: number;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();

try {
       // Get current user from parameter (no hook usage)
       if (!user) {
         throw new Error('User not authenticated');
       }

      // Get or create conversation context
      const conversationId = `${user.id}-${sessionId}`;
      let context = this.conversations.get(conversationId);

      if (!context) {
        context = {
          userId: user.id,
          sessionId,
          messages: [],
          relevantDocuments: [],
        };
        this.conversations.set(conversationId, context);
      }

      // Add user message to conversation
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };
      context.messages.push(userMessage);

      // Generate context if requested
      let relevantDocuments: SearchResult[] = [];
      if (options.includeContext !== false) {
        relevantDocuments = await this.generateContext(
          message,
          user.id,
          options.contextTypes,
          options.maxContextDocuments
        );
        context.relevantDocuments = relevantDocuments;
      }

      // Generate AI response
      const aiResponse = await this.generateResponse(
        message,
        context,
        user,
        options
      );

      // Add AI response to conversation
      context.messages.push(aiResponse.message);

      const processingTime = Date.now() - startTime;

      return {
        ...aiResponse,
        context: relevantDocuments,
        processingTime,
      };
    } catch (error) {
      console.error('AI Service error:', error);
      throw new Error(`AI Service failed: ${error}`);
    }
  }

  private async generateContext(
    query: string,
    userId: string,
    types?: string[],
    limit: number = 5
  ): Promise<SearchResult[]> {
    try {
      const filters: any = { userId };
      if (types && types.length > 0) {
        filters.type = { $in: types };
      }

      const results = await this.vectorStore.search(query, limit, filters);
      return results;
    } catch (error) {
      console.error('Context generation failed:', error);
      return [];
    }
  }

  private async generateResponse(
    message: string,
    context: ConversationContext,
    user: { id: string; name?: string; level?: number; streak?: number },
    options: any
  ): Promise<Omit<AIResponse, 'context' | 'processingTime'>> {
    const activeModel = this.modelManager.getActiveModel();
    const pipeline = this.modelManager.getActivePipeline();

    // No model files on device. Answer from the local engine over real records
    // rather than failing, so the assistant is usable out of the box.
    if (!activeModel || activeModel.type !== 'llm' || !pipeline) {
      return this.generateLocalResponse(message, user);
    }

    try {
// Build system prompt with context
       const systemPrompt = this.buildSystemPrompt(context, user);

      // Build conversation history
      const conversationHistory = context.messages
        .slice(-10) // Keep last 10 messages for context
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Combine system prompt and conversation
      const fullPrompt = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ];

      // Generate response
      const result = await pipeline(fullPrompt, {
        temperature: options.temperature || 0.7,
        max_new_tokens: options.maxTokens || 500,
        do_sample: true,
        pad_token_id: pipeline.tokenizer.eos_token_id,
      });

      const responseText = result[0]?.generated_text || 'I apologize, but I could not generate a response.';

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        modelUsed: activeModel.id,
        contextUsed: context.relevantDocuments.map((doc) => doc.document.id),
        tokensUsed: this.estimateTokens(responseText),
      };

      return {
        message: aiMessage,
        modelUsed: activeModel.id,
        tokensUsed: aiMessage.tokensUsed || 0,
        backend: 'model',
      };
    } catch (error) {
      // A model that fails to run is a degraded path, not a broken feature.
      console.error('Model generation failed, falling back to local engine:', error);
      return this.generateLocalResponse(message, user);
    }
  }

  private async generateLocalResponse(
    message: string,
    user: { id: string; name?: string; level?: number; streak?: number }
  ): Promise<Omit<AIResponse, 'context' | 'processingTime'>> {
    const snapshot: UserSnapshot = applyUserProfile(
      await buildSnapshot(user.id, user.name),
      user
    );

    const content = generateInsight(message, snapshot);
    const aiMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      modelUsed: 'local-insight-engine',
      tokensUsed: this.estimateTokens(content),
    };

    return {
      message: aiMessage,
      modelUsed: 'local-insight-engine',
      tokensUsed: aiMessage.tokensUsed || 0,
      backend: 'local',
    };
  }

private buildSystemPrompt(context: ConversationContext, user: { id: string; name?: string }): string {
     const currentDate = new Date().toLocaleDateString();

     let prompt = `You are HyperAssist, an AI assistant for the HyperVerse life operating system.

 Current date: ${currentDate}
 User: ${user.name || 'User'}

 Your role is to help the user manage their life through tasks, habits, health, finances, and personal growth. You have access to their personal data through the context provided.

 Guidelines:
 - Be helpful, supportive, and concise
 - Use the provided context to give personalized advice
 - Focus on actionable insights and recommendations
 - Maintain privacy and confidentiality
 - If you don't have relevant context, ask for clarification
 - Encourage positive habits and productivity`;

     // Add relevant context information
     if (context.relevantDocuments.length > 0) {
       prompt += '\n\nRelevant Context:\n';
       for (const doc of context.relevantDocuments.slice(0, 5)) {
         prompt += `- ${doc.document.metadata.type}: ${doc.document.content.substring(0, 200)}...\n`;
       }
     }

     prompt += '\n\nPlease provide a helpful and personalized response based on the user\'s request and their data.';

     return prompt;
   }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  async indexUserData(userId: string): Promise<void> {
    try {
      // This would integrate with the database layer to index user data
      // For now, we'll provide the structure
      console.log(`Indexing user data for user: ${userId}`);

      // Example: Index recent tasks
      // const tasks = await this.taskRepository.getRecentTasks(userId);
      // const taskDocuments: VectorDocument[] = tasks.map(task => ({
      //   id: `task-${task.id}`,
      //   content: `${task.title} ${task.description || ''}`,
      //   metadata: {
      //     type: 'task',
      //     userId,
      //     timestamp: task.createdAt,
      //     title: task.title,
      //     category: task.category,
      //     tags: task.parsedTags,
      //   },
      // }));
      // await this.vectorStore.addDocuments(taskDocuments);

      console.log('User data indexing completed');
    } catch (error) {
      console.error('User data indexing failed:', error);
      throw new Error(`Failed to index user data: ${error}`);
    }
  }

async clearConversation(sessionId: string = 'default', user: { id: string; name?: string }): Promise<void> {
     if (!user) return;

     const conversationId = `${user.id}-${sessionId}`;
     this.conversations.delete(conversationId);
     
     // Also clear from storage if implemented
     console.log(`Cleared conversation: ${conversationId}`);
   }

async getConversationHistory(
     sessionId: string = 'default',
     user: { id: string; name?: string }
   ): Promise<ChatMessage[]> {
     if (!user) return [];

     const conversationId = `${user.id}-${sessionId}`;
     const context = this.conversations.get(conversationId);
     return context?.messages || [];
   }

async exportConversations(user: { id: string; name?: string }): Promise<string> {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userConversations: any[] = [];

      for (const context of this.conversations.values()) {
        if (context.userId === user.id) {
          userConversations.push({
            sessionId: context.sessionId,
            messages: context.messages,
            exportedAt: Date.now(),
          });
        }
      }

      return JSON.stringify(userConversations, null, 2);
    }

  async getModelInfo(): Promise<AIModel | null> {
    return this.modelManager.getActiveModel();
  }

  async switchModel(modelId: string): Promise<void> {
    await this.modelManager.loadModel(modelId);
    console.log(`Switched to AI model: ${modelId}`);
  }

   private getUserConversationCount(userId: string): number {
     let count = 0;
     for (const context of this.conversations.values()) {
       if (context.userId === userId) {
         count++;
       }
     }
     return count;
   }

   async getStats(user: { id: string; name?: string }): Promise<{
     totalConversations: number;
     totalMessages: number;
     averageResponseTime: number;
     modelsUsed: string[];
   }> {
     let totalMessages = 0;
     const totalResponseTime = 0;
     let responseCount = 0;
     const modelsUsed = new Set<string>();

     for (const context of this.conversations.values()) {
       // Filter by userId
       if (context.userId !== user.id) {
         continue;
       }
       
       totalMessages += context.messages.length;
       
       for (const message of context.messages) {
         if (message.role === 'assistant') {
           if (message.modelUsed) {
             modelsUsed.add(message.modelUsed);
           }
           // Response time would need to be tracked separately
           responseCount++;
         }
       }
     }

     return {
       totalConversations: this.getUserConversationCount(user.id),
       totalMessages,
       averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
       modelsUsed: Array.from(modelsUsed),
     };
   }
}

export default AIService;
