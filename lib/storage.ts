import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Web fallback using localStorage
const webStorage = {
  getItemAsync: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },
  setItemAsync: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  },
  deleteItemAsync: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Silent fail for delete
    }
  },
};

// Universal storage adapter
export const storage = Platform.OS === 'web' ? webStorage : SecureStore;

// Export types for consistency
export type StorageAdapter = typeof webStorage;

// Helper functions with error handling
export const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await storage.getItemAsync(key);
  } catch (error) {
    console.warn(`Failed to get item ${key}:`, error);
    return null;
  }
};

export const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    await storage.setItemAsync(key, value);
  } catch (error) {
    console.warn(`Failed to set item ${key}:`, error);
    throw error;
  }
};

export const safeDeleteItem = async (key: string): Promise<void> => {
  try {
    await storage.deleteItemAsync(key);
  } catch (error) {
    console.warn(`Failed to delete item ${key}:`, error);
    throw error;
  }
};
