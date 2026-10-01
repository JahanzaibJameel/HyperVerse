import { BACKGROUND_GRACE_MS, useAuthStore } from '@/lib/stores/authStore';
import AuthService from '@/lib/services/AuthService';

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
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store = {};
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';

const PERSIST_KEY = 'hyperverse-auth';

const profile = {
  id: 'user_abc',
  deviceId: 'device_abc',
  name: 'Test User',
  email: 'test@example.com',
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  streak: 0,
  tokens: 100,
  nfts: 0,
  isActive: true,
  createdAt: 1,
  updatedAt: 1,
};

const resetStore = () => {
  useAuthStore.setState({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    hasAccount: false,
    lastAuthTimestamp: null,
  });
};

beforeEach(async () => {
  await AsyncStorage.clear();
  resetStore();
  jest.clearAllMocks();
});

describe('authStore persistence boundary', () => {
  /**
   * This is the regression test for the authentication bypass.
   *
   * The original bug: `partialize` returned `{ user, isAuthenticated }`, so a
   * cold start rehydrated `isAuthenticated: true` straight out of AsyncStorage
   * and the app opened without any unlock prompt. Anyone who could read the
   * AsyncStorage file — or anyone holding an unlocked device — was in.
   *
   * The assertion is deliberately about the *serialised payload*, not about
   * store behaviour, because that payload is exactly what survives a restart.
   */
  it('never serialises isAuthenticated, even after a successful unlock', async () => {
    const store = useAuthStore.getState();

    store.setUser(profile);
    store.markUnlocked(profile);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem(PERSIST_KEY);
    expect(raw).not.toBeNull();

    const persisted = JSON.parse(raw as string);

    expect(persisted).not.toHaveProperty('isAuthenticated');
    expect(persisted.state).not.toHaveProperty('isAuthenticated');
    expect(Object.keys(persisted.state).sort()).toEqual([
      'deviceId',
      'hasAccount',
      'lastAuthTimestamp',
      'userId',
    ]);
  });

  it('persists identity hints so the launch flow can tell setup from unlock', async () => {
    useAuthStore.getState().setUser(profile);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const persisted = JSON.parse(
      (await AsyncStorage.getItem(PERSIST_KEY)) as string
    ).state;

    expect(persisted.hasAccount).toBe(true);
    expect(persisted.userId).toBe('user_abc');
    expect(persisted.deviceId).toBe('device_abc');
  });

  it('does not copy the user profile into plaintext AsyncStorage', async () => {
    useAuthStore.getState().setUser(profile);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const raw = (await AsyncStorage.getItem(PERSIST_KEY)) as string;

    // The profile is recoverable from SecureStore, so persisting name/email in
    // plaintext was a redundant copy of PII outside the keychain.
    expect(raw).not.toContain('Test User');
    expect(raw).not.toContain('test@example.com');
  });

  /**
   * The second half of the bypass: even with a clean payload, a rehydrated
   * store must not start unlocked. Zustand merges the persisted object over
   * `initialState`, so `isAuthenticated` has to stay at its initial `false`.
   */
  it('starts a fresh store locked, and a rehydrated store stays locked', async () => {
    useAuthStore.getState().markUnlocked(profile);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Simulate a cold start: only what was persisted carries over.
    const raw = (await AsyncStorage.getItem(PERSIST_KEY)) as string;
    const persisted = JSON.parse(raw).state;

    resetStore();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Rehydrate exactly as the persist middleware would: merge over defaults.
    useAuthStore.setState({
      ...useAuthStore.getState(),
      hasAccount: persisted.hasAccount,
      lastAuthTimestamp: persisted.lastAuthTimestamp,
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().hasAccount).toBe(true);
  });

  it('never grants isAuthenticated through setUser', () => {
    useAuthStore.getState().setUser(profile);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().hasAccount).toBe(true);
  });

  it('lock() clears authentication but keeps the profile for the unlock screen', () => {
    useAuthStore.getState().markUnlocked(profile);
    useAuthStore.getState().lock();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).not.toBeNull();
  });

  it('logout keeps hasAccount so a returning user lands on unlock, not setup', () => {
    useAuthStore.getState().markUnlocked(profile);
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().hasAccount).toBe(true);
  });
});

describe('AuthService.authenticateForApp contract', () => {
  const service = AuthService.getInstance();

  it('resolves unlocked when app lock is switched off', async () => {
    await service.disableAppLock();
    await service.disableBiometricAuth();

    await expect(service.authenticateForApp()).resolves.toEqual({
      status: 'unlocked',
      reason: 'not-required',
    });
  });

  it('does not throw when the user cancels the prompt', async () => {
    await service.enableAppLock();
    await service.enableBiometricAuth();

    const LocalAuthentication = require('expo-local-authentication');
    LocalAuthentication.authenticateAsync.mockResolvedValueOnce({
      success: false,
      error: 'user_cancel',
    });

    // A cancel is a normal outcome, not an exception.
    const result = await service.authenticateForApp();
    expect(result.status).toBe('locked');
    expect((result as { reason: string }).reason).toBe('cancelled');

    await service.disableAppLock();
  });

  it('fails closed when app lock is on but no credential is enrolled', async () => {
    await service.enableAppLock();
    await service.disableBiometricAuth();

    const result = await service.authenticateForApp();

    // Must NOT be 'unlocked' — this is the case that would otherwise let anyone
    // straight through once enrolment disappeared.
    expect(result.status).toBe('locked');
    expect((result as { reason: string }).reason).toBe('unavailable');

    await service.disableAppLock();
  });

  it('resolves unlocked once a biometric check succeeds', async () => {
    await service.enableAppLock();
    await service.enableBiometricAuth();

    await expect(service.authenticateForApp()).resolves.toEqual({
      status: 'unlocked',
      reason: 'biometric',
    });

    await service.disableAppLock();
  });
});

describe('background grace window policy', () => {
  it('is an explicit five-minute window', () => {
    expect(BACKGROUND_GRACE_MS).toBe(5 * 60 * 1000);
  });
});
