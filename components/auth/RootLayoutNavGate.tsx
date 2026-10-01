import React from 'react';

import { useAppUnlock } from './useAppUnlock';

/**
 * Renders its children only when the app is unlocked.
 *
 * The unlock and setup screens are rendered by the `(auth)` route group, which
 * reads the same store, so this component only has to decide whether the app is
 * allowed through. That keeps the launch decision in one place and makes it
 * testable without mounting the whole router.
 */
export function RootLayoutNavGate({ children }: { children: React.ReactNode }) {
  const unlock = useAppUnlock();

  if (unlock.phase === 'checking') {
    return null;
  }

  if (unlock.phase === 'unlocked') {
    return <>{children}</>;
  }

  // While locked (or before an account exists) the `(auth)` group owns the
  // screen: `unlock` for a returning user, `setup` for a first run. Rendering
  // `children` here would be the bypass this gate exists to prevent.
  return null;
}

export default RootLayoutNavGate;
