import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { XPBar } from '@/components/XPBar';
import { useAuthStore } from '@/lib/stores/authStore';
import type { UserProfile } from '@/lib/services/AuthService';

/**
 * XPBar reads level and XP from `useAuthStore`, the same store the screens
 * award XP through. Each story seeds that store rather than providing a value
 * through a separate context, so the stories exercise the real data path.
 */
const BASE: UserProfile = {
  id: 'story_user',
  dbId: 'story_row',
  deviceId: 'story_device',
  name: 'Runner',
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
};

/**
 * Seeded in a decorator rather than in `render`, so the store write happens
 * outside the render pass instead of as a side effect of rendering a component.
 */
function withUser(user: Partial<UserProfile>) {
  return (Story: () => React.JSX.Element) => {
    useAuthStore.setState({ user: { ...BASE, ...user } });
    return <Story />;
  };
}

const meta = {
  title: 'Components/XPBar',
  component: XPBar,
  parameters: {
    docs: {
      description: {
        component:
          'Level and XP progress bar. The fill animates from 0 to the current percentage over 1 '
          + 'second, and the gradient runs cyan to purple.',
      },
    },
  },
} satisfies Meta<typeof XPBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [withUser({ name: 'Neural Runner', level: 7, xp: 3240, xpToNextLevel: 5000, streak: 12, tokens: 2847, nfts: 6 })],
};

export const Low: Story = {
  decorators: [withUser({ name: 'New Runner', level: 1, xp: 120, xpToNextLevel: 1000 })],
};

export const NearMax: Story = {
  decorators: [withUser({ name: 'Veteran', level: 42, xp: 4999, xpToNextLevel: 5000, streak: 100, tokens: 99999, nfts: 1337 })],
};

export const MaxedOut: Story = {
  decorators: [withUser({ name: 'Legend', level: 99, xp: 5000, xpToNextLevel: 5000, streak: 365, tokens: 1 << 30, nfts: 500 })],
};

export const ZeroXP: Story = {
  decorators: [withUser({ name: 'Fresh', level: 1, xp: 0, xpToNextLevel: 1000 })],
};

export const NoProfile: Story = {
  decorators: [
    (Story: () => React.JSX.Element) => {
      // No profile yet: the bar has to render level 1 at 0 XP rather than
      // standing in a fabricated figure.
      useAuthStore.setState({ user: null });
      return <Story />;
    },
  ],
};

export const Grid: Story = {
  render: () => <View style={{ gap: 10 }} />,
  decorators: [
    withUser({ name: 'Runner', level: 7, xp: 3240, xpToNextLevel: 5000, streak: 12, tokens: 2847, nfts: 6 }),
  ],
};