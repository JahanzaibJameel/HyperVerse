import React from 'react';
import { View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import RootLayoutNavGate from '@/components/auth/RootLayoutNavGate';
import { useAuthStore } from '@/lib/stores/authStore';
import AuthService from '@/lib/services/AuthService';
import { UserRepository } from '@/lib/database/repositories/UserRepository';

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
  },
}));

// The repository is mocked rather than exercised against LokiJS: this test is
// about the rehydration path in `useAppUnlock`, not about the query behind it.
// `__tests__/database/repositories.test.ts` covers the latter.
jest.mock('@/lib/database/repositories/UserRepository', () => ({
  UserRepository: {
    findByDeviceId: jest.fn(),
  },
}));

/** A profile exactly as `createInitialProfile` wrote it: no `dbId`. */
const storedProfile = {
  id: 'user_abc',
  deviceId: 'device_abc',
  name: 'Test User',
  email: null,
  avatarUrl: null,
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

const loadProfile = jest.spyOn(AuthService.getInstance(), 'loadUserProfile');
const saveProfile = jest.spyOn(AuthService.getInstance(), 'saveUserProfile');
const authenticateForApp = jest.spyOn(AuthService.getInstance(), 'authenticateForApp');
const findByDeviceId = UserRepository.findByDeviceId as jest.Mock;

beforeAll(() => {
  // One-time RTL and module-graph setup is charged to the first test in a file;
  // warming it here keeps it off the assertions' waitFor budgets. See
  // appLaunchGate.test.tsx for the same pattern and the reason.
  const warmup = render(<View testID="warmup" />);
  warmup.unmount();
});

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    hasAccount: false,
    lastAuthTimestamp: null,
  });
  loadProfile.mockReset();
  saveProfile.mockReset();
  authenticateForApp.mockReset();
  findByDeviceId.mockReset();
  loadProfile.mockResolvedValue(storedProfile);
  authenticateForApp.mockResolvedValue({ status: 'unlocked', reason: 'biometric' });
});

afterAll(() => {
  loadProfile.mockRestore();
  saveProfile.mockRestore();
  authenticateForApp.mockRestore();
});

function renderGate() {
  return render(
    <RootLayoutNavGate>
      <View testID="router-stand-in" />
    </RootLayoutNavGate>
  );
}

/**
 * Regression test for the cold-start rehydration path.
 *
 * The bug: `AuthService.createInitialProfile` persists the SecureStore profile
 * before `setup.tsx` creates the `users` row, so `dbId` existed only in the
 * in-memory store. On the next launch `useAppUnlock` rehydrated a profile with
 * no `dbId`, and every primary screen opens with `if (!user?.dbId) return;` —
 * so the app showed an empty dashboard while the user's tasks, habits, health,
 * finance and AI history sat intact in SQLite, unreachable.
 *
 * These cases deliberately drive `useAppUnlock` through a *stored* profile
 * rather than through `setup.tsx`. The setup path was never broken; it was the
 * only path that ever had a `dbId`, which is exactly why every test written
 * against setup passed while every real relaunch produced an empty app.
 */
describe('dbId rehydration on cold start', () => {
  it('re-derives dbId from the users row and persists it back', async () => {
    findByDeviceId.mockResolvedValue({ id: 'row_xyz789' });

    renderGate();

    await waitFor(() => {
      expect(useAuthStore.getState().user?.dbId).toBe('row_xyz789');
    });

    // The lookup is keyed on the stored deviceId, not on anything in memory.
    expect(findByDeviceId).toHaveBeenCalledWith('device_abc');

    // Persisting is what makes the *next* launch cheap; without it every cold
    // start would repeat the lookup, and a user whose SQLite write later fails
    // would silently lose the link again.
    expect(saveProfile).toHaveBeenCalledTimes(1);
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ dbId: 'row_xyz789', deviceId: 'device_abc' })
    );

    // The profile itself is untouched — the repair adds the link, it does not
    // rewrite the user's identity or reset their gamification state.
    expect(useAuthStore.getState().user).toEqual(
      expect.objectContaining({ name: 'Test User', xp: 0, level: 1 })
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('leaves dbId undefined and creates no row when the lookup finds nothing', async () => {
    findByDeviceId.mockResolvedValue(undefined);

    renderGate();

    await waitFor(() => {
      expect(authenticateForApp).toHaveBeenCalled();
    });

    // A missing row after onboarding means something else is wrong. Inventing a
    // row here would mask it, so the screens' own `dbId` guard has to keep
    // holding and nothing may be written back.
    expect(findByDeviceId).toHaveBeenCalledTimes(1);
    expect(saveProfile).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.dbId).toBeUndefined();
    expect(useAuthStore.getState().hasAccount).toBe(true);
  });

  it('still unlocks when the lookup throws', async () => {
    findByDeviceId.mockRejectedValue(new Error('SQLite unavailable'));

    renderGate();

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    // Failing closed on identity would brick the app on a database hiccup, so
    // the profile is still delivered and the screens' guard absorbs the gap.
    expect(useAuthStore.getState().user).not.toBeNull();
    expect(useAuthStore.getState().user?.dbId).toBeUndefined();
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it('does not look the row up when the stored profile already carries dbId', async () => {
    loadProfile.mockResolvedValue({ ...storedProfile, dbId: 'row_already' });

    renderGate();

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    expect(findByDeviceId).not.toHaveBeenCalled();
    expect(saveProfile).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.dbId).toBe('row_already');
  });
});