import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { pipeline, env } from '@xenova/transformers';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  size: number; // in bytes
  type: 'llm' | 'embedding';
  version: string;
  downloadUrl?: string;
  localPath?: string;
  isDownloaded: boolean;
  isActive: boolean;
}

export interface ModelDownloadProgress {
  modelId: string;
  progress: number; // 0-100
  bytesDownloaded: number;
  totalBytes: number;
  status: 'downloading' | 'completed' | 'failed' | 'paused';
}

class ModelManager {
  private static instance: ModelManager;
  private models: Map<string, AIModel> = new Map();
  private downloadProgress: Map<string, ModelDownloadProgress> = new Map();
  private activePipeline: any = null;

  private readonly MODELS_DIR = `${FileSystem.documentDirectory}ai-models/`;
  private readonly MODELS_CONFIG_KEY = 'hv_ai_models_config';

  private constructor() {
    this.initializeModels();
  }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  private async initializeModels(): Promise<void> {
    // Ensure models directory exists
    await this.ensureModelsDirectory();

    // Load model configurations
    await this.loadModelConfigs();

    // Initialize default models
    const defaultModels: AIModel[] = [
      {
        id: 'gemma-2b-it',
        name: 'Gemma 2B Instruct',
        description: 'Lightweight instruction-tuned model for general conversation',
        size: 1.6 * 1024 * 1024 * 1024, // 1.6GB
        type: 'llm',
        version: '1.0.0',
        downloadUrl: 'https://huggingface.co/Xenova/gemma-2b-it/resolve/main/onnx/model_quantized.onnx',
        isDownloaded: false,
        isActive: false,
      },
      {
        id: 'all-minilm-l6-v2',
        name: 'MiniLM-L6-v2',
        description: 'Compact embedding model for semantic search',
        size: 90 * 1024 * 1024, // 90MB
        type: 'embedding',
        version: '1.0.0',
        downloadUrl: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model_quantized.onnx',
        isDownloaded: false,
        isActive: false,
      },
    ];

    for (const model of defaultModels) {
      if (!this.models.has(model.id)) {
        this.models.set(model.id, model);
      }
    }

    await this.saveModelConfigs();
  }

  private async ensureModelsDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.MODELS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.MODELS_DIR, { intermediates: true });
    }
  }

  private async loadModelConfigs(): Promise<void> {
    try {
      const configData = await FileSystem.readAsStringAsync(this.MODELS_CONFIG_KEY);
      const configs = JSON.parse(configData) as AIModel[];
      
      for (const config of configs) {
        this.models.set(config.id, config);
      }
    } catch (error) {
      console.log('No existing model configs found');
    }
  }

  private async saveModelConfigs(): Promise<void> {
    const configs = Array.from(this.models.values());
    const configData = JSON.stringify(configs, null, 2);
    await FileSystem.writeAsStringAsync(this.MODELS_CONFIG_KEY, configData);
  }

  async getAllModels(): Promise<AIModel[]> {
    return Array.from(this.models.values());
  }

  async getModel(modelId: string): Promise<AIModel | null> {
    return this.models.get(modelId) || null;
  }

  async downloadModel(modelId: string, onProgress?: (progress: ModelDownloadProgress) => void): Promise<void> {
    const model = this.models.get(modelId);
    if (!model || !model.downloadUrl) {
      throw new Error('Model not found or no download URL available');
    }

    if (model.isDownloaded) {
      throw new Error('Model already downloaded');
    }

    const localPath = `${this.MODELS_DIR}${modelId}.onnx`;
    
    // Update progress
    const progress: ModelDownloadProgress = {
      modelId,
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: model.size,
      status: 'downloading',
    };
    this.downloadProgress.set(modelId, progress);
    onProgress?.(progress);

    try {
      // Create download resumable
      const downloadResumable = FileSystem.createDownloadResumable(
        model.downloadUrl,
        localPath,
        {},
        (downloadProgress) => {
          const progressData: ModelDownloadProgress = {
            modelId,
            progress: Math.round((downloadProgress.totalBytesWritten / model.size) * 100),
            bytesDownloaded: downloadProgress.totalBytesWritten,
            totalBytes: model.size,
            status: 'downloading',
          };
          this.downloadProgress.set(modelId, progressData);
          onProgress?.(progressData);
        }
      );

      // Start download
      const result = await downloadResumable.downloadAsync();
      
      if (result && result.status === 200) {
        // Update model config
        const updatedModel = {
          ...model,
          localPath,
          isDownloaded: true,
        };
        this.models.set(modelId, updatedModel);
        await this.saveModelConfigs();

        // Update progress
        const completedProgress: ModelDownloadProgress = {
          modelId,
          progress: 100,
          bytesDownloaded: model.size,
          totalBytes: model.size,
          status: 'completed',
        };
        this.downloadProgress.set(modelId, completedProgress);
        onProgress?.(completedProgress);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      const failedProgress: ModelDownloadProgress = {
        modelId,
        progress: 0,
        bytesDownloaded: 0,
        totalBytes: model.size,
        status: 'failed',
      };
      this.downloadProgress.set(modelId, failedProgress);
      onProgress?.(failedProgress);
      throw error;
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model || !model.localPath) {
      throw new Error('Model not found or not downloaded');
    }

    try {
      await FileSystem.deleteAsync(model.localPath);
      
      const updatedModel = {
        ...model,
        localPath: undefined,
        isDownloaded: false,
        isActive: false,
      };
      this.models.set(modelId, updatedModel);
      await this.saveModelConfigs();

      // Clear pipeline if this was the active model
      if (this.activePipeline && model.isActive) {
        await this.unloadModel();
      }
    } catch (error) {
      throw new Error(`Failed to delete model: ${error}`);
    }
  }

  async loadModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model || !model.isDownloaded || !model.localPath) {
      throw new Error('Model not available for loading');
    }

    try {
      // Unload current model if any
      if (this.activePipeline) {
        await this.unloadModel();
      }

      // Configure transformers environment
      env.localModelPath = this.MODELS_DIR;
      env.allowRemoteModels = false;
      env.allowLocalModels = true;

      // Load pipeline based on model type
      if (model.type === 'llm') {
        this.activePipeline = await pipeline('text-generation', model.localPath);
      } else if (model.type === 'embedding') {
        this.activePipeline = await pipeline('feature-extraction', model.localPath);
      }

      // Update model status
      for (const [id, m] of this.models.entries()) {
        const updatedModel = { ...m, isActive: id === modelId };
        this.models.set(id, updatedModel);
      }
      await this.saveModelConfigs();
    } catch (error) {
      throw new Error(`Failed to load model: ${error}`);
    }
  }

  async unloadModel(): Promise<void> {
    if (this.activePipeline) {
      try {
        // Dispose of the pipeline
        if (typeof this.activePipeline.dispose === 'function') {
          await this.activePipeline.dispose();
        }
        this.activePipeline = null;
      } catch (error) {
        console.warn('Error disposing pipeline:', error);
      }
    }

    // Update model status
    for (const [id, model] of this.models.entries()) {
      if (model.isActive) {
        const updatedModel = { ...model, isActive: false };
        this.models.set(id, updatedModel);
      }
    }
    await this.saveModelConfigs();
  }

  getActiveModel(): AIModel | null {
    for (const model of this.models.values()) {
      if (model.isActive) {
        return model;
      }
    }
    return null;
  }

  getActivePipeline(): any {
    return this.activePipeline;
  }

  getDownloadProgress(modelId: string): ModelDownloadProgress | null {
    return this.downloadProgress.get(modelId) || null;
  }

  async getModelsStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      const modelsDir = await FileSystem.readDirectoryAsync(this.MODELS_DIR);
      let totalSize = 0;

      for (const fileName of modelsDir) {
        if (fileName.endsWith('.onnx')) {
          const fileInfo = await FileSystem.getInfoAsync(`${this.MODELS_DIR}${fileName}`);
          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size;
          }
        }
      }

      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      
      return {
        used: totalSize,
        available: freeSpace,
      };
    } catch (error) {
      return { used: 0, available: 0 };
    }
  }

  async clearAllModels(): Promise<void> {
    // Unload active model
    await this.unloadModel();

    // Delete all model files
    try {
      await FileSystem.deleteAsync(this.MODELS_DIR);
      await this.ensureModelsDirectory();
    } catch (error) {
      console.warn('Error clearing models directory:', error);
    }

    // Reset model configurations
    for (const [id, model] of this.models.entries()) {
      const resetModel = {
        ...model,
        localPath: undefined,
        isDownloaded: false,
        isActive: false,
      };
      this.models.set(id, resetModel);
    }
    await this.saveModelConfigs();
  }
}

export default ModelManager;
