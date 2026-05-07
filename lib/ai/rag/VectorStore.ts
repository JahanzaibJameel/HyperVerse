import { Database } from 'lancedb';
import * as FileSystem from 'expo-file-system';

import { ModelManager } from '../models/ModelManager';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    type: 'task' | 'habit' | 'note' | 'health' | 'finance' | 'event';
    userId: string;
    timestamp: number;
    title?: string;
    category?: string;
    tags?: string[];
  };
  embedding?: number[];
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

class VectorStore {
  private static instance: VectorStore;
  private db: Database | null = null;
  private modelManager: ModelManager;
  private readonly VECTOR_DB_PATH = `${FileSystem.documentDirectory}vector-db/`;

  private constructor() {
    this.modelManager = ModelManager.getInstance();
  }

  static getInstance(): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Ensure vector DB directory exists
      await this.ensureVectorDBDirectory();

      // Initialize LanceDB
      this.db = await Database.connect(this.VECTOR_DB_PATH);
      
      console.log('Vector store initialized successfully');
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw new Error('Vector store initialization failed');
    }
  }

  private async ensureVectorDBDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.VECTOR_DB_PATH);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.VECTOR_DB_PATH, { intermediates: true });
    }
  }

  async addDocument(document: VectorDocument): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      // Generate embedding for the document
      const embedding = await this.generateEmbedding(document.content);
      
      const documentWithEmbedding = {
        ...document,
        embedding,
      };

      // Store in vector database
      const table = await this.getOrCreateTable('documents');
      await table.add([documentWithEmbedding]);

      console.log(`Document added: ${document.id}`);
    } catch (error) {
      console.error('Failed to add document:', error);
      throw new Error(`Failed to add document: ${error}`);
    }
  }

  async addDocuments(documents: VectorDocument[]): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      // Generate embeddings for all documents
      const documentsWithEmbeddings = await Promise.all(
        documents.map(async (doc) => ({
          ...doc,
          embedding: await this.generateEmbedding(doc.content),
        }))
      );

      // Store in vector database
      const table = await this.getOrCreateTable('documents');
      await table.add(documentsWithEmbeddings);

      console.log(`Added ${documents.length} documents to vector store`);
    } catch (error) {
      console.error('Failed to add documents:', error);
      throw new Error(`Failed to add documents: ${error}`);
    }
  }

  async search(
    query: string,
    limit: number = 10,
    filters?: Partial<VectorDocument['metadata']>
  ): Promise<SearchResult[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Get table
      const table = await this.getOrCreateTable('documents');

      // Build search query
      let searchQuery = table.search(queryEmbedding).limit(limit);

      // Apply filters if provided
      if (filters) {
        if (filters.type) {
          searchQuery = searchQuery.where('metadata.type', '=', filters.type);
        }
        if (filters.userId) {
          searchQuery = searchQuery.where('metadata.userId', '=', filters.userId);
        }
        if (filters.category) {
          searchQuery = searchQuery.where('metadata.category', '=', filters.category);
        }
      }

      // Execute search
      const results = await searchQuery.toArray();

      return results.map((result: any) => ({
        document: {
          id: result.id,
          content: result.content,
          metadata: result.metadata,
        },
        score: result._distance || 0,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const table = await this.getOrCreateTable('documents');
      await table.delete(`id = '${documentId}'`);
      console.log(`Document deleted: ${documentId}`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw new Error(`Failed to delete document: ${error}`);
    }
  }

  async updateDocument(document: VectorDocument): Promise<void> {
    // Delete old document and add new one
    await this.deleteDocument(document.id);
    await this.addDocument(document);
  }

  async getUserDocuments(userId: string): Promise<VectorDocument[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const table = await this.getOrCreateTable('documents');
      const results = await table
        .where('metadata.userId', '=', userId)
        .toArray();

      return results.map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
      }));
    } catch (error) {
      console.error('Failed to get user documents:', error);
      return [];
    }
  }

  async clearUserData(userId: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const table = await this.getOrCreateTable('documents');
      await table.delete(`metadata.userId = '${userId}'`);
      console.log(`Cleared all documents for user: ${userId}`);
    } catch (error) {
      console.error('Failed to clear user data:', error);
      throw new Error(`Failed to clear user data: ${error}`);
    }
  }

  async getStats(): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    storageSize: number;
  }> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const table = await this.getOrCreateTable('documents');
      const allDocuments = await table.toArray();

      const documentsByType: Record<string, number> = {};
      for (const doc of allDocuments) {
        const type = doc.metadata?.type || 'unknown';
        documentsByType[type] = (documentsByType[type] || 0) + 1;
      }

      // Get storage size
      const storageInfo = await FileSystem.getInfoAsync(this.VECTOR_DB_PATH);
      const storageSize = storageInfo.size || 0;

      return {
        totalDocuments: allDocuments.length,
        documentsByType,
        storageSize,
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalDocuments: 0,
        documentsByType: {},
        storageSize: 0,
      };
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const embeddingModel = await this.modelManager.getModel('all-minilm-l6-v2');
    if (!embeddingModel || !embeddingModel.isActive) {
      throw new Error('Embedding model not loaded');
    }

    const pipeline = this.modelManager.getActivePipeline();
    if (!pipeline) {
      throw new Error('No active pipeline found');
    }

    try {
      const result = await pipeline(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data);
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  private async getOrCreateTable(tableName: string) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Try to open existing table
      return await this.db.openTable(tableName);
    } catch (error) {
      // Table doesn't exist, create it
      return await this.db.createTable(tableName, [
        { name: 'id', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'metadata', type: 'string' },
        { name: 'embedding', type: 'vector', size: 384 }, // MiniLM-L6-v2 produces 384-dimensional embeddings
      ]);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export default VectorStore;
