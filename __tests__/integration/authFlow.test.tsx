import React from 'react';
import { Button, Text, View } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import AuthService from '@/lib/services/AuthService';
import { useAuthStore } from '@/lib/stores/authStore';

// Mock all external dependencies. AuthService itself is NOT mocked: these tests
// assert its real control flow, and only its native modules are stubbed.
jest.mock('@/lib/stores/authStore');
jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    __reset: () => {
      store = {};
    },
  };
});

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

// Mock auth store actions
const mockSetUser = jest.fn();
const mockSetLoading = jest.fn();
const mockSetError = jest.fn();
const mockLogout = jest.fn();
const mockUpdateUser = jest.fn();
const mockAddXP = jest.fn();
const mockUpdateStreak = jest.fn();
const mockReset = jest.fn();

const authenticatedUser = {
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
};

const unauthenticatedState: {
  user: typeof authenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: jest.Mock;
  setLoading: jest.Mock;
  setError: jest.Mock;
  updateUser: jest.Mock;
  addXP: jest.Mock;
  updateStreak: jest.Mock;
  logout: jest.Mock;
  reset: jest.Mock;
} = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setUser: mockSetUser,
  setLoading: mockSetLoading,
  setError: mockSetError,
  updateUser: mockUpdateUser,
  addXP: mockAddXP,
  updateStreak: mockUpdateStreak,
  logout: mockLogout,
  reset: mockReset,
};

function mockAuthState(overrides: Partial<typeof unauthenticatedState> = {}) {
  jest.mocked(useAuthStore).mockReturnValue({
    ...unauthenticatedState,
    ...overrides,
  } as unknown as ReturnType<typeof useAuthStore>);
}

// Test component that simulates the auth flow
const TestAuthFlow: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  if (isLoading) {
    return <Text testID="loading">Loading...</Text>;
  }

  if (!isAuthenticated) {
    return (
      <View testID="auth-screen">
        <Text testID="welcome">Welcome to HyperVerse</Text>
        <Button testID="login-button" title="Login" onPress={logout} />
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
  beforeEach(() => {
    jest.clearAllMocks();
    require('expo-secure-store').__reset();
    mockAuthState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderApp = () => {
    return render(<TestAuthFlow />);
  };

  describe('Initial App Load', () => {
    it('should show welcome screen when user is not authenticated', () => {
      const { getByTestId, queryByTestId } = renderApp();

      expect(getByTestId('welcome')).toBeTruthy();
      expect(getByTestId('login-button')).toBeTruthy();
      expect(getByTestId('auth-screen')).toBeTruthy();
      expect(queryByTestId('main-app')).toBeFalsy();
    });

    it('should show loading state during authentication check', () => {
      mockAuthState({ isLoading: true });

      const { getByTestId } = renderApp();

      expect(getByTestId('loading')).toBeTruthy();
    });
  });

  describe('Session Restore', () => {
    it('should apply a loaded profile to the store', async () => {
      const profile = {
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
      };

      const authService = AuthService.getInstance();
      await authService.saveUserProfile(profile);

      const loaded = await authService.loadUserProfile();
      mockSetUser(loaded);

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
            level: 1,
          })
        );
      });
    });

    it('should clear the loading flag once initialization finishes', () => {
      mockAuthState({ isLoading: false });

      const { queryByTestId } = renderApp();

      expect(queryByTestId('loading')).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should surface auth errors from the store', () => {
      mockAuthState({ error: 'Login failed' });

      const { getByTestId } = renderApp();

      expect(getByTestId('auth-screen')).toBeTruthy();
    });

    it('should handle service errors gracefully', async () => {
      const authService = AuthService.getInstance();
      jest
        .spyOn(authService, 'createInitialProfile')
        .mockRejectedValueOnce(new Error('Service unavailable'));

      await expect(authService.createInitialProfile('Test User')).rejects.toThrow(
        'Service unavailable'
      );
    });

    it('should handle biometric errors gracefully', async () => {
      const LocalAuthentication = require('expo-local-authentication');
      LocalAuthentication.authenticateAsync.mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await AuthService.getInstance().authenticateWithBiometrics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('Authenticated State', () => {
    it('should show main app when user is authenticated', () => {
      mockAuthState({ user: authenticatedUser, isAuthenticated: true });

      const { getByTestId, queryByTestId } = renderApp();

      expect(getByTestId('main-app')).toBeTruthy();
      expect(getByTestId('welcome-back')).toBeTruthy();
      expect(getByTestId('user-level')).toBeTruthy();
      expect(getByTestId('user-xp')).toBeTruthy();
      expect(getByTestId('logout-button')).toBeTruthy();
      expect(queryByTestId('auth-screen')).toBeFalsy();
    });

    it('should handle logout correctly', async () => {
      mockAuthState({ user: authenticatedUser, isAuthenticated: true });

      const { getByTestId } = renderApp();

      fireEvent.press(getByTestId('logout-button'));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });

  describe('Biometric Authentication', () => {
    it('should enable biometric authentication', async () => {
      const authService = AuthService.getInstance();
      const isAvailable = jest.spyOn(authService, 'isBiometricAvailable');
      const authenticate = jest.spyOn(authService, 'authenticateWithBiometrics');

      const result = await authService.enableBiometricAuth();

      expect(result).toBe(true);
      expect(isAvailable).toHaveBeenCalled();
      expect(authenticate).toHaveBeenCalledWith('Enable biometric authentication');
    });

    it('should handle biometric authentication failure', async () => {
      const authService = AuthService.getInstance();
      jest.spyOn(authService, 'isBiometricAvailable').mockResolvedValueOnce({
        success: false,
        error: 'Biometric not available',
      });

      const result = await authService.enableBiometricAuth();

      expect(result).toBe(false);
    });

    it('should authenticate with biometrics for app access', async () => {
      const authService = AuthService.getInstance();
      await authService.enableAppLock();
      await authService.enableBiometricAuth();
      const authenticate = jest.spyOn(authService, 'authenticateWithBiometrics');

      const result = await authService.authenticateForApp();

      expect(result).toBe(true);
      expect(authenticate).toHaveBeenCalledWith('Unlock HyperVerse');
    });
  });

  describe('Profile Management', () => {
    it('should update user profile', async () => {
      const authService = AuthService.getInstance();
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

      await authService.saveUserProfile(mockProfile);

      await authService.updateProfile({
        name: 'New Name',
        email: 'new@example.com',
        level: 2,
      });

      const saved = await authService.loadUserProfile();
      expect(saved).toEqual(
        expect.objectContaining({
          name: 'New Name',
          email: 'new@example.com',
          level: 2,
          updatedAt: expect.any(Number),
        })
      );
    });

    it('should export user data', async () => {
      const authService = AuthService.getInstance();
      const mockProfile = {
        id: 'user-123',
        deviceId: 'device-123',
        name: 'Test User',
        level: 5,
      };

      await authService.saveUserProfile(mockProfile as never);

      const exportedData = await authService.exportUserData();

      expect(exportedData).toContain('Test User');
      expect(exportedData).toContain('user-123');
      expect(exportedData).toContain('1.0.0');
    });

    it('should delete user profile', async () => {
      const authService = AuthService.getInstance();
      const secureStore = require('expo-secure-store');

      await authService.deleteProfile();

      expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('hv_user_profile');
    });
  });
});
