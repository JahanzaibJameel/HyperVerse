export { default as AIService } from './AIService';
export { default as ModelManager } from './models/ModelManager';
export { default as VectorStore } from './rag/VectorStore';

export type { AIModel, ModelDownloadProgress } from './models/ModelManager';
export type { VectorDocument, SearchResult } from './rag/VectorStore';
export type { ChatMessage, AIResponse, ConversationContext } from './AIService';
