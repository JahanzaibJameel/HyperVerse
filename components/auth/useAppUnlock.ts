import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  BACKGROUND_GRACE_MS,
  useAuthStore,
} from '@/lib/stores/authStore';
import AuthService, {
  type AppUnlockResult,
  type LockedReason,
} from '@/lib/services/AuthService';

export type UnlockState =
  | { phase: 'checking' }
  | { phase: 'unlocked' }
  | { phase: 'locked'; reason: LockedReason; error?: string }
  | { phase: 'no-account' };

/**
 * Owns the launch-time unlock decision.
 *
 * Two rules this hook exists to enforce:
 *
 * 1. Loading a profile is not authentication. `setUser` hydrates identity from
 *    SecureStore; only `authenticateForApp` resolving `unlocked` may grant access.
 * 2. The background grace window never applies to a cold start. Every fresh
 *    launch runs the real check regardless of the persisted
 *    `lastAuthTimestamp`.
 */
export function useAppUnlock(): UnlockState {
  const [unlock, setUnlock] = useState<UnlockState>({ phase: 'checking' });
  const { setUser, setLoading, markUnlocked, lock } = useAuthStore();
  const backgroundedAt = useRef<number | null>(null);

  const runUnlock = useCallback(async (): Promise<AppUnlockResult> => {
    const result = await AuthService.getInstance().authenticateForApp();

    if (result.status === 'unlocked') {
      setUnlock({ phase: 'unlocked' });
      return result;
    }

    setUnlock({ phase: 'locked', reason: result.reason, error: result.error });
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initializeApp = async () => {
      try {
        setLoading(true);

        const profile = await AuthService.getInstance().loadUserProfile();

        if (cancelled) return;

        if (!profile) {
          // Nothing to unlock: this is a first run.
          setUnlock({ phase: 'no-account' });
          return;
        }

        setUser(profile);

        const result = await runUnlock();

        if (!cancelled && result.status === 'unlocked') {
          markUnlocked(profile);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('App initialization failed:', error);
          // Fail closed. A startup error is never treated as a successful unlock.
          setUnlock({
            phase: 'locked',
            reason: 'failed',
            error: error instanceof Error ? error.message : 'Startup failed',
          });
        }
      } finally {
        if (!cancelled) {
          // Release the splash either way, so a SecureStore or SQLite failure
          // lands on the lock screen rather than a permanently blank screen.
          setLoading(false);
        }
      }
    };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading, markUnlocked, runUnlock]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAt.current = Date.now();
        return;
      }

      if (next !== 'active') return;

      const since = backgroundedAt.current;
      backgroundedAt.current = null;
      if (since === null) return;
      if (Date.now() - since < BACKGROUND_GRACE_MS) return;

      // Past the grace window the session must be re-verified.
      lock();
      setUnlock({ phase: 'locked', reason: 'cancelled' });

      void runUnlock().then((result) => {
        if (result.status === 'unlocked') {
          setUnlock({ phase: 'unlocked' });
          markUnlocked(useAuthStore.getState().user);
        }
      });
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [lock, runUnlock, markUnlocked]);

  return unlock;
}
