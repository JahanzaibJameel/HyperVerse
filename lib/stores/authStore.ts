import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { UserProfile } from '../services/AuthService';

/**
 * How long the app may stay unlocked after being backgrounded before it must
 * be unlocked again. Five minutes, matching the default timeout of comparable
 * banking apps. Set to 0 to re-lock on every background transition.
 */
export const BACKGROUND_GRACE_MS = 5 * 60 * 1000;

/**
 * The only shape that is ever written to storage.
 *
 * `isAuthenticated` is deliberately absent. It is a runtime fact — "this
 * process has been unlocked since it started" — and persisting it would let a
 * cold start skip the unlock check entirely. Anything written here survives an
 * app restart, so it must never carry authorisation meaning.
 */
export interface PersistedAuthState {
  hasAccount: boolean;
  userId: string | null;
  deviceId: string | null;
  lastAuthTimestamp: number | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  hasAccount: boolean;
  lastAuthTimestamp: number | null;
}

interface AuthStore extends AuthState {
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  addXP: (amount: number) => void;
  updateStreak: (increment?: boolean) => void;
  markUnlocked: (user: UserProfile | null) => void;
  lock: () => void;
  logout: () => void;
  reset: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  hasAccount: false,
  lastAuthTimestamp: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set: any, get: any) => ({
      ...initialState,

      // Loading a profile does not unlock the app. Cold start hydrates the
      // SecureStore copy and then still has to pass `authenticateForApp()`;
      // conflating the two is what made app lock bypassable.
      setUser: (user: UserProfile | null) => {
        set({
          user,
          hasAccount: !!user,
          error: null,
        });
      },

      /**
       * Record a successful unlock. This is the only transition that sets
       * `isAuthenticated`, so authorisation cannot be reached by hydration.
       */
      markUnlocked: (user: UserProfile | null) => {
        set({
          user,
          isAuthenticated: true,
          hasAccount: !!user,
          lastAuthTimestamp: Date.now(),
          error: null,
        });
      },

      /**
       * Drop back to locked while keeping the profile, so the unlock screen can
       * restore it without a full reload.
       */
      lock: () => {
        set({ isAuthenticated: false });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      updateUser: (updates: Partial<UserProfile>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            ...updates,
            updatedAt: Date.now(),
          };
          set({ user: updatedUser });
        }
      },

      addXP: (amount: number) => {
        const currentUser = get().user;
        if (!currentUser) return;

        let newXP = currentUser.xp + amount;
        let newLevel = currentUser.level;
        let newXPToNext = currentUser.xpToNextLevel;

        if (newXP >= currentUser.xpToNextLevel) {
          newLevel += 1;
          const overflowXP = newXP - currentUser.xpToNextLevel;
          newXPToNext = Math.floor(currentUser.xpToNextLevel * 1.5);
          newXP = overflowXP;
        }

        set({
          user: {
            ...currentUser,
            xp: newXP,
            level: newLevel,
            xpToNextLevel: newXPToNext,
            updatedAt: Date.now(),
          },
        });
      },

      updateStreak: (increment: boolean = true) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const newStreak = increment ? currentUser.streak + 1 : Math.max(0, currentUser.streak - 1);
        set({
          user: {
            ...currentUser,
            streak: newStreak,
            updatedAt: Date.now(),
          },
        });
      },

      logout: () => {
        set({
          ...initialState,
          isAuthenticated: false,
          // An account still exists until `deleteProfile` clears SecureStore, so
          // hasAccount must survive logout to keep the launch flow on the unlock
          // screen rather than bouncing a returning user into first-run setup.
          hasAccount: get().hasAccount,
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'hyperverse-auth',
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * Persists identity hints, never authorisation.
       *
       * The full `user` profile is intentionally excluded: it is recoverable
       * from SecureStore via `AuthService.loadUserProfile()`, and keeping a
       * plaintext copy of the name and email in AsyncStorage was a needless
       * copy of PII outside the keychain.
       *
       * `isAuthenticated` MUST NOT appear here. Zustand merges the persisted
       * object over `initialState`, so persisting it would restore
       * `isAuthenticated: true` on cold start and skip the unlock check.
       */
      partialize: (state: any): PersistedAuthState => ({
        hasAccount: state.hasAccount,
        userId: state.user?.id ?? null,
        deviceId: state.user?.deviceId ?? null,
        lastAuthTimestamp: state.lastAuthTimestamp,
      }),
    }
  )
);
