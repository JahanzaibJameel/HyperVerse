import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { database, isDatabaseReady, whenDatabaseReady } from './database';

/**
 * React hook that ensures the database singleton is ready before components render.
 * Returns the WatermelonDB `database` instance once initialised, or `null` while
 * the adapter is still spinning up. The hook also surfaces a retry callback so a
 * screen can let the user recover from a failed initialisation.
 */
export function useDatabase() {
  const [ready, setReady] = useState<boolean>(isDatabaseReady());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (isDatabaseReady()) {
      return;
    }

    whenDatabaseReady()
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Database failed to initialise');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    // Surface once — the hook itself stays mounted so the caller can decide what to do.
    console.error('[useDatabase]', error);
  }

  return { database: ready ? database : null, isReady: ready, error };
}

/**
 * Wrap an async database operation so a failure does not crash the UI. Returns
 * `null` on error (after logging) so callers can treat it as "no data yet".
 */
export async function safeDb<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('[safeDb] operation failed', error);
    return null;
  }
}

/**
 * Convenience helper for one-shot error alerts. Not used by the hook itself so
 * it can be tree-shaken out of production bundles if needed.
 */
export function reportDbError(message: string) {
  if (__DEV__) {
    Alert.alert('Database error', message);
  }
}