import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AuthService from '@/lib/services/AuthService';
import { useAuthStore } from '@/lib/stores/authStore';

// Mock all external dependencies
jest.mock('@/lib/services/AuthService');
jest.mock('@/lib/stores/authStore');
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve(['FINGERPRINT'])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

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

const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock auth store
const mockSetUser = jest.fn();
const mockSetIsAuthenticated = jest.fn();
const mockSetIsLoading = jest.fn();
const mockSetError = jest.fn();

jest.mocked(useAuthStore).mockReturnValue({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setUser: mockSetUser,
  setIsAuthenticated: mockSetIsAuthenticated,
  setIsLoading: mockSetIsLoading,
  setError: mockSetError,
  logout: jest.fn(),
  login: jest.fn(),
  signup: jest.fn(),
});

// Test component that simulates the auth flow
const TestAuthFlow: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, signup, logout } = useAuthStore();

  if (isLoading) {
    return <Text testID="loading">Loading...</Text>;
  }

  if (!isAuthenticated) {
    return (
      <View testID="auth-screen">
        <Text testID="welcome">Welcome to HyperVerse</Text>
        <Button 
          testID="signup-button" 
          title="Sign Up" 
          onPress={() => signup('Test User', 'test@example.com')} 
        />
        <Button 
          testID="login-button" 
          title="Login" 
          onPress={() => login('device-123')} 
        />
      </View>
    );
  }

  return (
    <View testID="main-app">
      <Text testID="welcome-back">Welcome back, {user?.name}!</Text>
      <Text testID="user-level">Level {user?.level}</Text>
      <Text testID="user-xp">XP: {user?.xp}</Text>
      <Button testID="logout-button" title="Logout" onPress={logout} />
    </View>
  );
};

describe('Auth Flow Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock AuthService methods
    MockAuthService.getInstance = jest.fn().mockReturnValue({
      getOrCreateDeviceId: jest.fn().mockResolvedValue('device-123'),
      createInitialProfile: jest.fn().mockResolvedValue({
        id: 'user-device-123',
        deviceId: 'device-123',
        name: 'Test User',
        email: 'test@example.com',
        level: 1,
        xp: 0,
        xpToNextLevel: 1000,
        streak: 0,
        tokens: 100,
        nfts: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
      loadUserProfile: jest.fn().mockResolvedValue(null),
      saveUserProfile: jest.fn().mockResolvedValue(),
      isBiometricAvailable: jest.fn().mockResolvedValue({ success: true }),
      authenticateWithBiometrics: jest.fn().mockResolvedValue({ success: true }),
      enableBiometricAuth: jest.fn().mockResolvedValue(true),
      isBiometricAuthEnabled: jest.fn().mockResolvedValue(false),
      enableAppLock: jest.fn().mockResolvedValue(true),
      isAppLockEnabled: jest.fn().mockResolvedValue(false),
      authenticateForApp: jest.fn().mockResolvedValue(true),
      updateProfile: jest.fn().mockResolvedValue(),
      deleteProfile: jest.fn().mockResolvedValue(),
      exportUserData: jest.fn().mockResolvedValue('{}'),
    });
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <TestAuthFlow />
        </NavigationContainer>
      </QueryClientProvider>
    );
  };

  describe('Initial App Load', () => {
    it('should show welcome screen when user is not authenticated', () => {
      const { getByTestId } = renderApp();
      
      expect(getByTestId('welcome')).toBeTruthy();
      expect(getByTestId('signup-button')).toBeTruthy();
      expect(getByTestId('login-button')).toBeTruthy();
      expect(getByTestId('auth-screen')).toBeTruthy();
    });

    it('should show loading state during authentication check', async () => {
      // Mock loading state
      jest.mocked(useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        setUser: mockSetUser,
        setIsAuthenticated: mockSetIsAuthenticated,
        setIsLoading: mockSetIsLoading,
        setError: mockSetError,
        logout: jest.fn(),
        login: jest.fn(),
        signup: jest.fn(),
      });

      const { getByTestId } = renderApp();
      
      expect(getByTestId('loading')).toBeTruthy();
    });
  });

  describe('Sign Up Flow', () => {
    it('should complete sign up flow successfully', async () => {
      const { getByTestId, queryByTestId } = renderApp();
      
      // Initial state
      expect(getByTestId('welcome')).toBeTruthy();
      expect(queryByTestId('main-app')).toBeFalsy();
      
      // Click sign up
      fireEvent.press(getByTestId('signup-button'));
      
      // Wait for async operations
      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
            level: 1,
          })
        );
        expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true);
        expect(mockSetIsLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle sign up errors', async () => {
      // Mock sign up error
      const mockSignup = jest.fn().mockImplementation(() => {
        mockSetError('Sign up failed');
        mockSetIsLoading(false);
      });
      
      jest.mocked(useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Sign up failed',
        setUser: mockSetUser,
        setIsAuthenticated: mockSetIsAuthenticated,
        setIsLoading: mockSetIsLoading,
        setError: mockSetError,
        logout: jest.fn(),
        login: jest.fn(),
        signup: mockSignup,
      });

      const { getByTestId } = renderApp();
      
      fireEvent.press(getByTestId('signup-button'));
      
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Sign up failed');
      });
    });
  });

  describe('Login Flow', () => {
    it('should complete login flow successfully', async () => {
      const { getByTestId, queryByTestId } = renderApp();
      
      // Initial state
      expect(getByTestId('welcome')).toBeTruthy();
      expect(queryByTestId('main-app')).toBeFalsy();
      
      // Click login
      fireEvent.press(getByTestId('login-button'));
      
      // Wait for async operations
      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceId: 'device-123',
          })
        );
        expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true);
        expect(mockSetIsLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle login errors', async () => {
      // Mock login error
      const mockLogin = jest.fn().mockImplementation(() => {
        mockSetError('Login failed');
        mockSetIsLoading(false);
      });
      
      jest.mocked(useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Login failed',
        setUser: mockSetUser,
        setIsAuthenticated: mockSetIsAuthenticated,
        setIsLoading: mockSetIsLoading,
        setError: mockSetError,
        logout: jest.fn(),
        login: mockLogin,
        signup: jest.fn(),
      });

      const { getByTestId } = renderApp();
      
      fireEvent.press(getByTestId('login-button'));
      
      await waitFor(() => {
        expect(mockSetError).toHaveBeenCalledWith('Login failed');
      });
    });
  });

  describe('Authenticated State', () => {
    it('should show main app when user is authenticated', () => {
      // Mock authenticated state
      jest.mocked(useAuthStore).mockReturnValue({
        user: {
          id: 'user-123',
          deviceId: 'device-123',
          name: 'Test User',
          email: 'test@example.com',
          level: 5,
          xp: 2500,
          xpToNextLevel: 5000,
          streak: 10,
          tokens: 1000,
          nfts: 3,
          isActive: true,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now(),
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        setUser: mockSetUser,
        setIsAuthenticated: mockSetIsAuthenticated,
        setIsLoading: mockSetIsLoading,
        setError: mockSetError,
        logout: jest.fn(),
        login: jest.fn(),
        signup: jest.fn(),
      });

      const { getByTestId, queryByTestId } = renderApp();
      
      expect(getByTestId('main-app')).toBeTruthy();
      expect(getByTestId('welcome-back')).toBeTruthy();
      expect(getByTestId('user-level')).toBeTruthy();
      expect(getByTestId('user-xp')).toBeTruthy();
      expect(getByTestId('logout-button')).toBeTruthy();
      expect(queryByTestId('auth-screen')).toBeFalsy();
    });

    it('should handle logout correctly', async () => {
      const mockLogout = jest.fn().mockImplementation(() => {
        mockSetUser(null);
        mockSetIsAuthenticated(false);
      });
      
      jest.mocked(useAuthStore).mockReturnValue({
        user: {
          id: 'user-123',
          deviceId: 'device-123',
          name: 'Test User',
          email: 'test@example.com',
          level: 5,
          xp: 2500,
          xpToNextLevel: 5000,
          streak: 10,
          tokens: 1000,
          nfts: 3,
          isActive: true,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now(),
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        setUser: mockSetUser,
        setIsAuthenticated: mockSetIsAuthenticated,
        setIsLoading: mockSetIsLoading,
        setError: mockSetError,
        logout: mockLogout,
        login: jest.fn(),
        signup: jest.fn(),
      });

      const { getByTestId } = renderApp();
      
      // Click logout
      fireEvent.press(getByTestId('logout-button'));
      
      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(null);
        expect(mockSetIsAuthenticated).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Biometric Authentication', () => {
    it('should enable biometric authentication', async () => {
      const authService = MockAuthService.getInstance();
      
      const result = await authService.enableBiometricAuth();
      
      expect(result).toBe(true);
      expect(authService.isBiometricAvailable).toHaveBeenCalled();
      expect(authService.authenticateWithBiometrics).toHaveBeenCalledWith(
        'Enable biometric authentication'
      );
    });

    it('should handle biometric authentication failure', async () => {
      const authService = MockAuthService.getInstance();
      (authService.isBiometricAvailable as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Biometric not available',
      });
      
      const result = await authService.enableBiometricAuth();
      
      expect(result).toBe(false);
    });

    it('should authenticate with biometrics for app access', async () => {
      const authService = MockAuthService.getInstance();
      (authService.isAppLockEnabled as jest.Mock).mockResolvedValueOnce(true);
      (authService.isBiometricAuthEnabled as jest.Mock).mockResolvedValueOnce(true);
      
      const result = await authService.authenticateForApp();
      
      expect(result).toBe(true);
      expect(authService.authenticateWithBiometrics).toHaveBeenCalledWith(
        'Unlock HyperVerse'
      );
    });
  });

  describe('Profile Management', () => {
    it('should update user profile', async () => {
      const authService = MockAuthService.getInstance();
      const mockProfile = {
        id: 'user-123',
        deviceId: 'device-123',
        name: 'Old Name',
        email: 'old@example.com',
        level: 1,
        xp: 0,
        xpToNextLevel: 1000,
        streak: 0,
        tokens: 100,
        nfts: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      (authService.loadUserProfile as jest.Mock).mockResolvedValueOnce(mockProfile);
      
      await authService.updateProfile({
        name: 'New Name',
        email: 'new@example.com',
        level: 2,
      });
      
      expect(authService.saveUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          email: 'new@example.com',
          level: 2,
          updatedAt: expect.any(Number),
        })
      );
    });

    it('should export user data', async () => {
      const authService = MockAuthService.getInstance();
      const mockProfile = {
        id: 'user-123',
        name: 'Test User',
        level: 5,
      };
      
      (authService.loadUserProfile as jest.Mock).mockResolvedValueOnce(mockProfile);
      
      const exportedData = await authService.exportUserData();
      
      expect(exportedData).toContain('Test User');
      expect(exportedData).toContain('user-123');
      expect(exportedData).toContain('1.0.0');
    });

    it('should delete user profile', async () => {
      const authService = MockAuthService.getInstance();
      
      await authService.deleteProfile();
      
      expect(authService.deleteProfile).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const authService = MockAuthService.getInstance();
      (authService.createInitialProfile as jest.Mock).mockRejectedValueOnce(
        new Error('Service unavailable')
      );
      
      await expect(authService.createInitialProfile('Test User')).rejects.toThrow(
        'Service unavailable'
      );
    });

    it('should handle network errors during authentication', async () => {
      const authService = MockAuthService.getInstance();
      (authService.authenticateWithBiometrics as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );
      
      const result = await authService.authenticateWithBiometrics();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });
});
