import React from 'react';
import { Text, View } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';

import RootLayoutNavGate from '@/components/auth/RootLayoutNavGate';
import { useAuthStore } from '@/lib/stores/authStore';
import AuthService from '@/lib/services/AuthService';

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

const profile = {
  id: 'user_abc',
  deviceId: 'device_abc',
  name: 'Test User',
  email: null,
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
const authenticateForApp = jest.spyOn(AuthService.getInstance(), 'authenticateForApp');

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
  authenticateForApp.mockReset();
  loadProfile.mockResolvedValue(profile);
});

afterAll(() => {
  loadProfile.mockRestore();
  authenticateForApp.mockRestore();
});

/** Stand-in for the router's `(tabs)` group. */
function TabsShell({ testID }: { testID: string }) {
  return (
    <View testID={testID}>
      <Text>tabs</Text>
    </View>
  );
}

/**
 * Launch-path regression test.
 *
 * The bug being guarded: the root layout called `setUser(profile)` on cold start
 * and `setUser` set `isAuthenticated: !!user`. A stored profile therefore granted
 * a fully authenticated app with no prompt at all — `authenticateForApp` was
 * never called from any app code.
 */
describe('root layout launch gate', () => {
  it('does not render the router when unlock fails', async () => {
    authenticateForApp.mockResolvedValue({
      status: 'locked',
      reason: 'cancelled',
    });

    render(
      <RootLayoutNavGate>
        <TabsShell testID="tabs-shell" />
      </RootLayoutNavGate>
    );

    // `isLoading` only clears in the `finally` of the launch effect, so waiting
    // on it means the unlock decision has settled. Asserting the locked state
    // before that would pass even if the gate never ran.
    await waitFor(() => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    expect(authenticateForApp).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.queryByTestId('tabs-shell')).toBeNull();
  });

  it('renders the router and marks the session unlocked when unlock succeeds', async () => {
    authenticateForApp.mockResolvedValue({
      status: 'unlocked',
      reason: 'biometric',
    });

    render(
      <RootLayoutNavGate>
        <TabsShell testID="tabs-shell" />
      </RootLayoutNavGate>
    );

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    expect(screen.getByTestId('tabs-shell')).toBeTruthy();
    expect(useAuthStore.getState().user).not.toBeNull();
  });

  it('flips from locked to unlocked when the retry succeeds', async () => {
    authenticateForApp
      .mockResolvedValueOnce({ status: 'locked', reason: 'cancelled' })
      .mockResolvedValueOnce({ status: 'unlocked', reason: 'biometric' });

    render(
      <RootLayoutNavGate>
        <TabsShell testID="tabs-shell" />
      </RootLayoutNavGate>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('tabs-shell')).toBeNull();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Re-rendering after the user passes the check must let them in.
    render(
      <RootLayoutNavGate>
        <TabsShell testID="tabs-shell-2" />
      </RootLayoutNavGate>
    );

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(screen.getByTestId('tabs-shell-2')).toBeTruthy();
  });

  it('fails closed when the profile load itself throws', async () => {
    loadProfile.mockRejectedValue(new Error('SecureStore unavailable'));
    authenticateForApp.mockResolvedValue({
      status: 'unlocked',
      reason: 'not-required',
    });

    render(
      <RootLayoutNavGate>
        <TabsShell testID="tabs-shell" />
      </RootLayoutNavGate>
    );

    // Even though authenticateForApp said "unlocked", a failed startup must not
    // silently proceed as a normal authenticated session.
    await waitFor(() => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.queryByTestId('tabs-shell')).toBeNull();
  });

  it('routes a first run to setup instead of the lock screen', async () => {
    loadProfile.mockResolvedValue(null);
    authenticateForApp.mockResolvedValue({
      status: 'unlocked',
      reason: 'not-required',
    });

    render(
      <RootLayoutNavGate>
        <TabsShell testID="tabs-shell" />
      </RootLayoutNavGate>
    );

    await waitFor(() => {
      expect(useAuthStore.getState().hasAccount).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    // No account means nothing to unlock; the user belongs on setup, not the
    // lock screen, and certainly not the tabs.
    expect(screen.queryByTestId('tabs-shell')).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('always runs authenticateForApp on cold start', async () => {
    authenticateForApp.mockResolvedValue({
      status: 'unlocked',
      reason: 'biometric',
    });

    render(
      <RootLayoutNavGate>
        <TabsShell testID="tabs-shell" />
      </RootLayoutNavGate>
    );

    await waitFor(() => {
      expect(authenticateForApp).toHaveBeenCalledTimes(1);
    });
  });
});
