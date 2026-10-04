import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  BACKGROUND_GRACE_MS,
  useAuthStore,
} from '@/lib/stores/authStore';
import AuthService, {
  type AppUnlockResult,
  type LockedReason,
  type UserProfile,
} from '@/lib/services/AuthService';
import { UserRepository } from '@/lib/database/repositories/UserRepository';

export type UnlockState =
  | { phase: 'checking' }
  | { phase: 'unlocked' }
  | { phase: 'locked'; reason: LockedReason; error?: string }
  | { phase: 'no-account' };

/**
 * Re-attach `dbId` to a profile that was persisted before it was known.
 *
 * `AuthService.createInitialProfile` writes the SecureStore copy before
 * `app/(auth)/setup.tsx` creates the `users` row, so only the in-memory store
 * ever saw the row id. Every primary screen opens with `if (!user?.dbId) return;`
 * and scopes its queries by it, so on the next launch the whole app reads as
 * empty while the rows sit intact in SQLite. The same `undefined` also reaches
 * `deleteProfile(dbId?)`, whose cascade is guarded on `dbId` — so "delete all
 * data" would clear the keychain and leave every domain row in plaintext.
 *
 * The id is re-derived from `deviceId` instead of being written back at setup
 * time, because writing it at setup would repair only fresh installs and leave
 * every already-broken install broken.
 *
 * A row that cannot be found leaves `dbId` undefined rather than creating one.
 * A missing row after onboarding means something else is wrong — a wiped
 * database, or a write that never landed — and silently creating a row here
 * would mask that instead of surfacing it.
 */
async function resolveDbId(profile: UserProfile): Promise<UserProfile> {
  if (profile.dbId) return profile;

  try {
    const row = await UserRepository.findByDeviceId(profile.deviceId);
    if (!row) return profile;

    const repaired: UserProfile = { ...profile, dbId: row.id };
    // Persist so the next cold start does not have to look the row up again.
    await AuthService.getInstance().saveUserProfile(repaired);
    return repaired;
  } catch (error) {
    // A lookup failure is not a reason to invent an id, and not a reason to
    // withhold the profile either: the caller still gets a usable identity and
    // the screens' own `dbId` guard keeps them from querying without one.
    console.error('Failed to re-derive dbId from deviceId', error);
    return profile;
  }
}

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

        const hydrated = await resolveDbId(profile);

        if (cancelled) return;

        setUser(hydrated);

        const result = await runUnlock();

        if (!cancelled && result.status === 'unlocked') {
          markUnlocked(hydrated);
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
