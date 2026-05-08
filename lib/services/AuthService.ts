import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';
import { safeGetItem, safeSetItem, safeDeleteItem } from '../storage';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
  id: string;
  deviceId: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  tokens: number;
  nfts: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: any; // Using any for compatibility across platforms
}

class AuthService {
  private static instance: AuthService;
  private readonly DEVICE_ID_KEY = 'hv_device_id';
  private readonly USER_PROFILE_KEY = 'hv_user_profile';
  private readonly BIOMETRIC_ENABLED_KEY = 'hv_biometric_enabled';
  private readonly APP_LOCK_ENABLED_KEY = 'hv_app_lock_enabled';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Generate or retrieve device ID
   */
  async getOrCreateDeviceId(): Promise<string> {
    try {
      // Try to get existing device ID from secure storage
      const existingDeviceId = await safeGetItem(this.DEVICE_ID_KEY);
      if (existingDeviceId) {
        return existingDeviceId;
      }

      // Generate new device ID
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      const buildNumber = Constants.expoConfig?.ios?.buildNumber || '1';
      const timestamp = Date.now().toString();
      
      // Create unique device identifier
      const deviceInfo = `${Application.applicationId}-${appVersion}-${buildNumber}-${timestamp}`;
      const deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        deviceInfo
      );

      // Store device ID securely
      await safeSetItem(this.DEVICE_ID_KEY, deviceId);
      
      return deviceId;
    } catch (error) {
      console.error('Error generating device ID:', error);
      // Fallback to a simple timestamp-based ID
      return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Create initial user profile
   */
  async createInitialProfile(name: string, email?: string): Promise<UserProfile> {
    const deviceId = await this.getOrCreateDeviceId();
    const now = Date.now();

    const profile: UserProfile = {
      id: `user_${deviceId}`,
      deviceId,
      name,
      email,
      avatarUrl: null,
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      streak: 0,
      tokens: 100, // Starting tokens
      nfts: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveUserProfile(profile);
    return profile;
  }

  /**
   * Save user profile to secure storage
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const profileJson = JSON.stringify(profile);
      await safeSetItem(this.USER_PROFILE_KEY, profileJson);
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw new Error('Failed to save user profile');
    }
  }

  /**
   * Load user profile from secure storage
   */
  async loadUserProfile(): Promise<UserProfile | null> {
    try {
      // Try to get existing user profile from secure storage
      const profileJson = await safeGetItem(this.USER_PROFILE_KEY);
      if (!profileJson) return null;

      const profile = JSON.parse(profileJson) as UserProfile;
      
      // Validate profile structure
      if (!profile.id || !profile.deviceId || !profile.name) {
        console.warn('Invalid profile structure found');
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<BiometricResult> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return { success: false, error: 'Biometric hardware not available' };
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return { success: false, error: 'No biometric credentials enrolled' };
      }

      const biometryTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometryType = biometryTypes[0];

      return { success: true, biometryType };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticateWithBiometrics(promptMessage?: string): Promise<BiometricResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to access HyperVerse',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return { success: result.success };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometricAuth(): Promise<boolean> {
    try {
      const biometricResult = await this.isBiometricAvailable();
      if (!biometricResult.success) {
        return false;
      }

      const authResult = await this.authenticateWithBiometrics(
        'Enable biometric authentication'
      );
      
      if (authResult.success) {
        await safeSetItem(this.BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometricAuth(): Promise<void> {
    try {
      await safeDeleteItem(this.BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricAuthEnabled(): Promise<boolean> {
    try {
      const enabled = await safeGetItem(this.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric auth status:', error);
      return false;
    }
  }

  /**
   * Enable app lock
   */
  async enableAppLock(): Promise<boolean> {
    try {
      const biometricResult = await this.isBiometricAvailable();
      if (!biometricResult.success) {
        return false;
      }

      const authResult = await this.authenticateWithBiometrics(
        'Enable app lock'
      );
      
      if (authResult.success) {
        await safeSetItem(this.APP_LOCK_ENABLED_KEY, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling app lock:', error);
      return false;
    }
  }

  /**
   * Disable app lock
   */
  async disableAppLock(): Promise<void> {
    try {
      await safeDeleteItem(this.APP_LOCK_ENABLED_KEY);
    } catch (error) {
      console.error('Error disabling app lock:', error);
    }
  }

  /**
   * Check if app lock is enabled
   */
  async isAppLockEnabled(): Promise<boolean> {
    try {
      const enabled = await safeGetItem(this.APP_LOCK_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking app lock status:', error);
      return false;
    }
  }

  /**
   * Authenticate for app access
   */
  async authenticateForApp(): Promise<boolean> {
    const appLockEnabled = await this.isAppLockEnabled();
    if (!appLockEnabled) {
      return true; // No authentication required
    }

    const biometricEnabled = await this.isBiometricAuthEnabled();
    if (biometricEnabled) {
      const result = await this.authenticateWithBiometrics(
        'Unlock HyperVerse'
      );
      return result.success;
    }

    return false;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Omit<UserProfile, 'id' | 'deviceId' | 'createdAt'>>): Promise<void> {
    const currentProfile = await this.loadUserProfile();
    if (!currentProfile) {
      throw new Error('No user profile found');
    }

    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.saveUserProfile(updatedProfile);
  }

  /**
   * Delete user profile (for reset functionality)
   */
  async deleteProfile(): Promise<void> {
    try {
      await safeDeleteItem(this.USER_PROFILE_KEY);
      await safeDeleteItem(this.BIOMETRIC_ENABLED_KEY);
      await safeDeleteItem(this.APP_LOCK_ENABLED_KEY);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw new Error('Failed to delete user profile');
    }
  }

  /**
   * Export user data for backup
   */
  async exportUserData(): Promise<string> {
    const profile = await this.loadUserProfile();
    if (!profile) {
      throw new Error('No user data to export');
    }

    return JSON.stringify({
      profile,
      exportedAt: Date.now(),
      version: '1.0.0',
    }, null, 2);
  }
}

export default AuthService;
