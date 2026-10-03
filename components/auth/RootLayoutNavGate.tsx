import React from 'react';

import { useAppUnlock } from './useAppUnlock';

/**
 * Renders the router unless the app is locked.
 *
 * `children` is the entire root navigator, and `app/(auth)` sits inside the same
 * `<Stack>` as `app/(tabs)` (see `app/_layout.tsx`). The gate is therefore handed
 * both route groups at once and cannot pick between them: it can only decide
 * whether the router mounts at all. Keeping `(tabs)` out of reach on a first run
 * is the job of the `Redirect` in `app/(tabs)/_layout.tsx`, not this component.
 */
export function RootLayoutNavGate({ children }: { children: React.ReactNode }) {
  const unlock = useAppUnlock();

  if (unlock.phase === 'checking') {
    return null;
  }

  // `no-account` has to mount the router too, or `setup.tsx` — which lives
  // inside `(auth)` — is unreachable and a fresh install shows a blank screen
  // forever. It is safe because `useAppUnlock` returns before
  // `authenticateForApp()` when there is no profile, and because `(tabs)`
  // redirects to `(auth)/setup` for any session that is not unlocked.
  if (unlock.phase === 'unlocked' || unlock.phase === 'no-account') {
    return <>{children}</>;
  }

  // `locked` only: a stored profile that has not been verified must not reach
  // the router, and rendering `children` here is the bypass this gate exists to
  // prevent.
  return null;
}

export default RootLayoutNavGate;
