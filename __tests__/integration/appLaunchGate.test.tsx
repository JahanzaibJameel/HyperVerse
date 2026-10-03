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

beforeAll(() => {
  // The first test in a file pays for one-time RTL and module-graph setup
  // (~900ms here), which pushed it past its waitFor budget under parallel worker
  // load. Rendering a throwaway tree first moves that cost off the tests'
  // budget. The tree is unmounted immediately so auto-cleanup has nothing to do.
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

/** Stand-in for `app/(auth)/setup.tsx`. */
function SetupShell() {
  return (
    <View testID="setup-shell">
      <Text>setup</Text>
    </View>
  );
}

/**
 * Stand-in for the router the gate actually guards.
 *
 * `RootLayoutNavGate`'s children are the *whole* navigator: `app/(auth)` sits in
 * the same `<Stack>` as `app/(tabs)` (`app/_layout.tsx:31-33`), so the gate is
 * handed both route groups and can only decide whether the router mounts — not
 * which group shows. Holding `(tabs)` back on a first run is the job of the
 * `Redirect` in `app/(tabs)/_layout.tsx:20-22`, which sends any session that is
 * not unlocked to `(auth)/setup`.
 *
 * Modelling that redirect's outcome keeps these assertions about
 * *reachability* — "can the user reach setup?" — instead of about the
 * implementation detail that the gate returned `null`. The previous version
 * asserted only that children were absent, which is exactly why a blank screen
 * on first launch passed CI.
 */
function RouterStandIn({ tabsTestID }: { tabsTestID: string }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated && !user) {
    return <SetupShell />;
  }

  return <TabsShell testID={tabsTestID} />;
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
        <RouterStandIn tabsTestID="tabs-shell" />
      </RootLayoutNavGate>
    );

    // Wait on the unlock attempt itself, not on `isLoading`. `isLoading` is
    // already `false` in `initialState`, so waiting on it resolves on the first
    // poll — before the launch effect has run — and the call-count assertion
    // below then fails intermittently under load.
    await waitFor(() => {
      expect(authenticateForApp).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    // Neither route group may mount: a verified session is a precondition for
    // the router, so a leak here has to fail the test rather than render setup.
    expect(screen.queryByTestId('tabs-shell')).toBeNull();
    expect(screen.queryByTestId('setup-shell')).toBeNull();
  });

  it('renders the router and marks the session unlocked when unlock succeeds', async () => {
    authenticateForApp.mockResolvedValue({
      status: 'unlocked',
      reason: 'biometric',
    });

    render(
      <RootLayoutNavGate>
        <RouterStandIn tabsTestID="tabs-shell" />
      </RootLayoutNavGate>
    );

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    expect(screen.getByTestId('tabs-shell')).toBeTruthy();
    expect(screen.queryByTestId('setup-shell')).toBeNull();
    expect(useAuthStore.getState().user).not.toBeNull();
  });

  it('flips from locked to unlocked when the retry succeeds', async () => {
    authenticateForApp
      .mockResolvedValueOnce({ status: 'locked', reason: 'cancelled' })
      .mockResolvedValueOnce({ status: 'unlocked', reason: 'biometric' });

    render(
      <RootLayoutNavGate>
        <RouterStandIn tabsTestID="tabs-shell" />
      </RootLayoutNavGate>
    );

    // A retry does not re-run the launch effect, so the router staying absent is
    // asserted directly and then re-checked once the retry has unlocked. The
    // first `waitFor` only needs to let the initial lock settle.
    await waitFor(() => {
      expect(authenticateForApp).toHaveBeenCalledTimes(1);
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.queryByTestId('tabs-shell')).toBeNull();
    expect(screen.queryByTestId('setup-shell')).toBeNull();

    // Re-rendering after the user passes the check must let them in.
    render(
      <RootLayoutNavGate>
        <RouterStandIn tabsTestID="tabs-shell-2" />
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
        <RouterStandIn tabsTestID="tabs-shell" />
      </RootLayoutNavGate>
    );

    // `loadUserProfile` rejects before `runUnlock` is reached, so this is the one
    // scenario where `authenticateForApp` is never called. Wait on the profile
    // read instead: it is false before the effect runs and true once the launch
    // has started, which proves the wait is not resolving against `initialState`.
    // Pairing it with `isLoading === false` then proves it also settled.
    await waitFor(() => {
      expect(loadProfile).toHaveBeenCalled();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(screen.queryByTestId('tabs-shell')).toBeNull();
    // No profile was loaded, so the store has no user and the stand-in would
    // render setup if the router mounted. Asserting its absence is what keeps
    // this a fail-closed test rather than a first-run test.
    expect(screen.queryByTestId('setup-shell')).toBeNull();
  });

  it('routes a first run to setup instead of the lock screen', async () => {
    loadProfile.mockResolvedValue(null);
    authenticateForApp.mockResolvedValue({
      status: 'unlocked',
      reason: 'not-required',
    });

    render(
      <RootLayoutNavGate>
        <RouterStandIn tabsTestID="tabs-shell" />
      </RootLayoutNavGate>
    );

    // Wait on the profile read: `hasAccount` and `isLoading` are both already at
    // their resting values in `initialState`, so neither alone proves the launch
    // effect has run.
    await waitFor(() => {
      expect(loadProfile).toHaveBeenCalled();
      expect(useAuthStore.getState().hasAccount).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    // No account means nothing to unlock; the user belongs on setup, not the
    // lock screen, and certainly not the tabs.
    //
    // This is the assertion the previous version of this test was missing. It
    // only checked that the tabs group was absent, which a gate returning `null`
    // for *every* phase satisfied — including the phase that left a fresh
    // install staring at a blank screen with no way to create a profile.
    // Reachability of setup is the actual requirement; absence of tabs is not
    // sufficient evidence for it.
    expect(screen.getByTestId('setup-shell')).toBeTruthy();
    expect(screen.queryByTestId('tabs-shell')).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // `useAppUnlock` returns before `runUnlock()` when there is no profile, so a
    // first run must never reach the biometric check — there is nothing to
    // verify yet, and prompting for it would be both wrong and unauthenticated.
    expect(authenticateForApp).not.toHaveBeenCalled();
  });

  it('always runs authenticateForApp on cold start', async () => {
    authenticateForApp.mockResolvedValue({
      status: 'unlocked',
      reason: 'biometric',
    });

    render(
      <RootLayoutNavGate>
        <RouterStandIn tabsTestID="tabs-shell" />
      </RootLayoutNavGate>
    );

    await waitFor(() => {
      expect(authenticateForApp).toHaveBeenCalledTimes(1);
    });
  });
});
