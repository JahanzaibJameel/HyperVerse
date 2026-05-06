import ModelManager, { AIModel } from './models/ModelManager';
import VectorStore, { VectorDocument, SearchResult } from './rag/VectorStore';
import { useAuthStore } from '../stores/authStore';

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

  async sendMessage(
    message: string,
    sessionId: string = 'default',
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
      // Get current user
      const user = useAuthStore.getState().user;
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
        options
      );

      // Add AI response to conversation
      context.messages.push(aiResponse.message);

      // Save conversation to local storage if needed
      await this.saveConversation(conversationId, context);

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
    options: any
  ): Promise<Omit<AIResponse, 'context' | 'processingTime'>> {
    const activeModel = this.modelManager.getActiveModel();
    if (!activeModel || activeModel.type !== 'llm') {
      throw new Error('No active LLM model found');
    }

    const pipeline = this.modelManager.getActivePipeline();
    if (!pipeline) {
      throw new Error('No active pipeline found');
    }

    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

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
      };
    } catch (error) {
      console.error('Response generation failed:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const currentDate = new Date().toLocaleDateString();
    const user = useAuthStore.getState().user;

    let prompt = `You are HyperAssist, an AI assistant for the HyperVerse life operating system. 

Current date: ${currentDate}
User: ${user?.name || 'User'}

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

  async clearConversation(sessionId: string = 'default'): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const conversationId = `${user.id}-${sessionId}`;
    this.conversations.delete(conversationId);
    
    // Also clear from storage if implemented
    console.log(`Cleared conversation: ${conversationId}`);
  }

  async getConversationHistory(
    sessionId: string = 'default'
  ): Promise<ChatMessage[]> {
    const user = useAuthStore.getState().user;
    if (!user) return [];

    const conversationId = `${user.id}-${sessionId}`;
    const context = this.conversations.get(conversationId);
    return context?.messages || [];
  }

  async exportConversations(): Promise<string> {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userConversations: any[] = [];
    
    for (const [conversationId, context] of this.conversations.entries()) {
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

  private async saveConversation(conversationId: string, context: ConversationContext): Promise<void> {
    // This would save to local storage for persistence
    // For now, conversations are kept in memory
    console.log(`Conversation saved: ${conversationId}`);
  }

  async getStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    modelsUsed: string[];
  }> {
    let totalMessages = 0;
    let totalResponseTime = 0;
    let responseCount = 0;
    const modelsUsed = new Set<string>();

    for (const context of this.conversations.values()) {
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
      totalConversations: this.conversations.size,
      totalMessages,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      modelsUsed: Array.from(modelsUsed),
    };
  }
}

export default AIService;
