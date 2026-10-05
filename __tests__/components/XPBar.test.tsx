import React from 'react';
import { act, render, screen } from '@testing-library/react-native';

import { XPBar } from '@/components/XPBar';
import { useAuthStore } from '@/lib/stores/authStore';
import type { UserProfile } from '@/lib/services/AuthService';

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user_abc',
    dbId: 'row_abc',
    deviceId: 'device_abc',
    name: 'Test User',
    email: null,
    avatarUrl: null,
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    streak: 0,
    tokens: 0,
    nfts: 0,
    isActive: true,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: true,
    user: null,
    isLoading: false,
    error: null,
    hasAccount: true,
    lastAuthTimestamp: null,
  });
});

/**
 * Flattened text of a node.
 *
 * Neither `@testing-library/jest-native` matchers nor RNTL's built-in text
 * matchers are registered in this project, so the children array is joined
 * directly. `LVL {level}` renders as `['LVL ', 3]` and the XP label as
 * `['450', ' / ', '1,000', ' XP']`, so both flatten to the expected strings.
 */
function textOf(testID: string): string {
  const node = screen.getByTestId(testID);
  return (node.props.children as unknown[])
    .flat(Infinity)
    .filter((part) => part !== null && part !== undefined)
    .join('');
}

/**
 * Regression test for the XP bar's data source.
 *
 * The bug: `XPBar` read `user` from `context/AppContext`, whose state was
 * seeded with a fabricated `defaultUser` ("Neural Runner", level 7, 3240/5000)
 * that no screen ever wrote to — every screen awards XP through
 * `useAuthStore().addXP`. So a user who had just finished onboarding, held
 * level 1 and 0 XP, was told on the Home screen that they were level 7, and the
 * bar never moved no matter how much XP they earned.
 *
 * These cases assert the rendered numbers directly, which is the only thing
 * that distinguishes a live value from a constant: a bar still reading a
 * hardcoded 3240 would pass any assertion that only checked that *something*
 * renders.
 */
describe('XPBar', () => {
  it('renders the level and XP from the auth store', () => {
    useAuthStore.setState({ user: profile({ level: 3, xp: 450, xpToNextLevel: 1000 }) });

    render(<XPBar />);

    expect(textOf('xp-bar-level')).toBe('LVL 3');
    expect(textOf('xp-bar-progress')).toBe('450 / 1,000 XP');
  });

  it('re-renders when the store changes, proving the value is live', () => {
    useAuthStore.setState({ user: profile({ level: 3, xp: 450, xpToNextLevel: 1000 }) });

    render(<XPBar />);

    expect(textOf('xp-bar-progress')).toBe('450 / 1,000 XP');

    // Exactly what `addXP` does: the same user with `xp` advanced past the
    // next-level threshold and `level` bumped. `act` is required — the store
    // write happens outside React, so without it the subscription update is not
    // flushed and the assertion would read the pre-update tree.
    const current = useAuthStore.getState().user as UserProfile;
    act(() => {
      useAuthStore.setState({ user: { ...current, level: 4, xp: 1050, xpToNextLevel: 2000 } });
    });

    expect(textOf('xp-bar-level')).toBe('LVL 4');
    expect(textOf('xp-bar-progress')).toBe('1,050 / 2,000 XP');
  });

  it('never renders the retired AppContext seed values', () => {
    useAuthStore.setState({ user: profile({ level: 1, xp: 0, xpToNextLevel: 1000 }) });

    render(<XPBar />);

    const rendered = textOf('xp-bar-level') + textOf('xp-bar-progress');

    // "Neural Runner" at level 7 and 3,240/5,000 was what a brand-new user saw.
    expect(rendered).not.toContain('LVL 7');
    expect(rendered).not.toContain('3,240');
    expect(rendered).not.toContain('5,000');
  });

  it('falls back to level 1 and zero XP when there is no profile', () => {
    render(<XPBar />);

    expect(textOf('xp-bar-level')).toBe('LVL 1');
    expect(textOf('xp-bar-progress')).toBe('0 / 1,000 XP');
  });

  it('renders a zero next-level threshold without corrupting the fill', () => {
    useAuthStore.setState({ user: profile({ level: 2, xp: 100, xpToNextLevel: 0 }) });

    render(<XPBar />);

    // The fill width derives from `xp / xpToNextLevel`; a zero denominator would
    // make that Infinity and hand `Animated.timing` a value it cannot animate.
    expect(screen.getByTestId('xp-bar-fill')).toBeTruthy();
    expect(textOf('xp-bar-level')).toBe('LVL 2');
    expect(textOf('xp-bar-progress')).toBe('100 / 0 XP');
  });
});