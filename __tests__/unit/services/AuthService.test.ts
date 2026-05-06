import AuthService from '@/lib/services/AuthService';

// Mock expo modules
jest.mock('expo-application', () => ({
  applicationId: 'com.test.hyperverse',
  nativeBuildVersion: '1.0.0',
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn((algorithm, data) => 
    Promise.resolve(`mock-${algorithm}-${data}-digest`)
  ),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve(['FINGERPRINT'])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = AuthService.getInstance();
  });

  describe('getOrCreateDeviceId', () => {
    it('should create new device ID if none exists', async () => {
      const deviceId = await authService.getOrCreateDeviceId();
      
      expect(deviceId).toBeDefined();
      expect(typeof deviceId).toBe('string');
      expect(deviceId.length).toBeGreaterThan(0);
    });

    it('should return existing device ID if available', async () => {
      const mockSecureStore = require('expo-secure-store');
      mockSecureStore.getItemAsync.mockResolvedValueOnce('existing-device-id');
      
      const deviceId = await authService.getOrCreateDeviceId();
      
      expect(deviceId).toBe('existing-device-id');
    });
  });

  describe('createInitialProfile', () => {
    it('should create user profile with provided data', async () => {
      const profile = await authService.createInitialProfile('Test User', 'test@example.com');
      
      expect(profile).toMatchObject({
        name: 'Test User',
        email: 'test@example.com',
        level: 1,
        xp: 0,
        xpToNextLevel: 1000,
        streak: 0,
        tokens: 100,
        nfts: 0,
        isActive: true,
      });
      expect(profile.id).toBeDefined();
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it('should handle optional email parameter', async () => {
      const profile = await authService.createInitialProfile('Test User');
      
      expect(profile.email).toBeNull();
    });
  });

  describe('isBiometricAvailable', () => {
    it('should return success when biometrics are available', async () => {
      const mockLocalAuth = require('expo-local-authentication');
      mockLocalAuth.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValueOnce(true);
      
      const result = await authService.isBiometricAvailable();
      
      expect(result.success).toBe(true);
      expect(result.biometryType).toBe('FINGERPRINT');
    });

    it('should return error when biometrics are not available', async () => {
      const mockLocalAuth = require('expo-local-authentication');
      mockLocalAuth.hasHardwareAsync.mockResolvedValueOnce(false);
      
      const result = await authService.isBiometricAvailable();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });
  });

  describe('authenticateWithBiometrics', () => {
    it('should authenticate successfully', async () => {
      const mockLocalAuth = require('expo-local-authentication');
      mockLocalAuth.authenticateAsync.mockResolvedValueOnce({ success: true });
      
      const result = await authService.authenticateWithBiometrics('Test prompt');
      
      expect(result.success).toBe(true);
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Test prompt',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
    });

    it('should handle authentication failure', async () => {
      const mockLocalAuth = require('expo-local-authentication');
      mockLocalAuth.authenticateAsync.mockResolvedValueOnce({ success: false });
      
      const result = await authService.authenticateWithBiometrics();
      
      expect(result.success).toBe(false);
    });
  });

  describe('enableBiometricAuth', () => {
    it('should enable biometric authentication when successful', async () => {
      const mockLocalAuth = require('expo-local-authentication');
      mockLocalAuth.hasHardwareAsync.mockResolvedValueOnce(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValueOnce(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValueOnce(['FINGERPRINT']);
      mockLocalAuth.authenticateAsync.mockResolvedValueOnce({ success: true });
      
      const result = await authService.enableBiometricAuth();
      
      expect(result).toBe(true);
    });

    it('should return false when biometrics are not available', async () => {
      const mockLocalAuth = require('expo-local-authentication');
      mockLocalAuth.hasHardwareAsync.mockResolvedValueOnce(false);
      
      const result = await authService.enableBiometricAuth();
      
      expect(result).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile with provided data', async () => {
      const mockSecureStore = require('expo-secure-store');
      const existingProfile = {
        id: 'test-user',
        name: 'Old Name',
        email: 'old@example.com',
        level: 5,
        xp: 2500,
        xpToNextLevel: 5000,
        streak: 10,
        tokens: 1000,
        nfts: 3,
        isActive: true,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 3600000,
      };
      
      mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(existingProfile));
      
      await authService.updateProfile({
        name: 'New Name',
        email: 'new@example.com',
      });
      
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'hv_user_profile',
        expect.stringContaining('New Name'),
        expect.stringContaining('new@example.com'),
      );
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile and related data', async () => {
      const mockSecureStore = require('expo-secure-store');
      
      await authService.deleteProfile();
      
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('hv_user_profile');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('hv_biometric_enabled');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('hv_app_lock_enabled');
    });
  });

  describe('exportUserData', () => {
    it('should export user data as JSON', async () => {
      const mockProfile = {
        id: 'test-user',
        name: 'Test User',
        level: 5,
        xp: 2500,
      };
      
      const mockSecureStore = require('expo-secure-store');
      mockSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(mockProfile));
      
      const exportedData = await authService.exportUserData();
      
      expect(exportedData).toContain('Test User');
      expect(exportedData).toContain('test-user');
      expect(exportedData).toContain('1.0.0');
    });

    it('should throw error when no user data exists', async () => {
      const mockSecureStore = require('expo-secure-store');
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);
      
      await expect(authService.exportUserData()).rejects.toThrow('No user data to export');
    });
  });
});
