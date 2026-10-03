// expo-file-system 19 made the modern Directory/File API the default export and
// moved the imperative API this file uses to `expo-file-system/legacy`.
import * as FileSystem from 'expo-file-system/legacy';

import ModelManager from '../models/ModelManager';

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

interface StoredDocument extends VectorDocument {
  embedding: number[];
}

const VECTOR_DB_DIR_NAME = 'vector-db';
const VECTOR_DB_FILE_NAME = 'documents.json';

class VectorStore {
  private static instance: VectorStore;
  private documents: StoredDocument[] = [];
  private modelManager: ModelManager;
  private initialized = false;
  private readonly VECTOR_DB_PATH: string;

  private constructor() {
    this.modelManager = ModelManager.getInstance();
    this.VECTOR_DB_PATH = `${FileSystem.documentDirectory ?? ''}${VECTOR_DB_DIR_NAME}/`;
  }

  static getInstance(): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore();
    }
    return VectorStore.instance;
  }

  get storagePath(): string {
    return `${this.VECTOR_DB_PATH}${VECTOR_DB_FILE_NAME}`;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.ensureVectorDBDirectory();
      await this.loadDocuments();
      this.initialized = true;
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

  private async loadDocuments(): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(this.storagePath);
    if (!fileInfo.exists) {
      this.documents = [];
      return;
    }

    const raw = await FileSystem.readAsStringAsync(this.storagePath);
    const parsed = JSON.parse(raw) as StoredDocument[];
    this.documents = Array.isArray(parsed) ? parsed : [];
  }

  private async persistDocuments(): Promise<void> {
    await FileSystem.writeAsStringAsync(this.storagePath, JSON.stringify(this.documents));
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async addDocument(document: VectorDocument): Promise<void> {
    try {
      await this.ensureInitialized();
      const embedding = await this.generateEmbedding(document.content);
      const stored: StoredDocument = { ...document, embedding };
      this.documents = this.documents.filter((d) => d.id !== document.id);
      this.documents.push(stored);
      await this.persistDocuments();
      console.log(`Document added: ${document.id}`);
    } catch (error) {
      console.error('Failed to add document:', error);
      throw new Error(`Failed to add document: ${error}`);
    }
  }

  async addDocuments(documents: VectorDocument[]): Promise<void> {
    try {
      await this.ensureInitialized();
      const documentsWithEmbeddings: StoredDocument[] = await Promise.all(
        documents.map(async (doc) => ({
          ...doc,
          embedding: await this.generateEmbedding(doc.content),
        }))
      );

      const incomingIds = new Set(documentsWithEmbeddings.map((d) => d.id));
      this.documents = [
        ...this.documents.filter((d) => !incomingIds.has(d.id)),
        ...documentsWithEmbeddings,
      ];
      await this.persistDocuments();

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
    try {
      await this.ensureInitialized();
      const queryEmbedding = await this.generateEmbedding(query);

      const candidates = filters
        ? this.documents.filter((doc) => this.matchesFilters(doc, filters))
        : this.documents;

      return candidates
        .map((doc) => ({
          document: {
            id: doc.id,
            content: doc.content,
            metadata: doc.metadata,
          },
          score: cosineSimilarity(queryEmbedding, doc.embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  private matchesFilters(
    doc: StoredDocument,
    filters: Partial<VectorDocument['metadata']>
  ): boolean {
    if (filters.userId !== undefined && doc.metadata.userId !== filters.userId) {
      return false;
    }
    if (filters.type !== undefined && doc.metadata.type !== filters.type) {
      return false;
    }
    if (filters.category !== undefined && doc.metadata.category !== filters.category) {
      return false;
    }
    return true;
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const before = this.documents.length;
      this.documents = this.documents.filter((d) => d.id !== documentId);
      if (this.documents.length === before) {
        return;
      }
      await this.persistDocuments();
      console.log(`Document deleted: ${documentId}`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw new Error(`Failed to delete document: ${error}`);
    }
  }

  async updateDocument(document: VectorDocument): Promise<void> {
    await this.deleteDocument(document.id);
    await this.addDocument(document);
  }

  async getUserDocuments(userId: string): Promise<VectorDocument[]> {
    try {
      await this.ensureInitialized();
      return this.documents
        .filter((doc) => doc.metadata.userId === userId)
        .map(({ id, content, metadata }) => ({ id, content, metadata }));
    } catch (error) {
      console.error('Failed to get user documents:', error);
      return [];
    }
  }

  async clearUserData(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      this.documents = this.documents.filter((doc) => doc.metadata.userId !== userId);
      await this.persistDocuments();
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
    try {
      await this.ensureInitialized();

      const documentsByType: Record<string, number> = {};
      for (const doc of this.documents) {
        const type = doc.metadata?.type || 'unknown';
        documentsByType[type] = (documentsByType[type] || 0) + 1;
      }

      const storageInfo = await FileSystem.getInfoAsync(this.storagePath);
      const storageSize = storageInfo.exists && 'size' in storageInfo ? storageInfo.size ?? 0 : 0;

      return {
        totalDocuments: this.documents.length,
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
      return Array.from(result.data as ArrayLike<number>);
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error}`);
    }
  }

  async close(): Promise<void> {
    this.documents = [];
    this.initialized = false;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export default VectorStore;
