import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { XPBar } from '@/components/XPBar';
import { AppContext } from '@/context/AppContext';

/**
 * XPBar reads `user` from context. AppProvider's default user is fixed, so to
 * show different fill levels we provide a custom value through the same
 * context the component reads from.
 */
function UserProvider({ user, children }: { user: any; children: React.ReactNode }) {
  const value = {
    user,
    health: { steps: 0, stepsGoal: 0, calories: 0, sleep: 0, heartRate: 0, workouts: 0 },
    finance: { balance: 0, income: 0, expenses: 0, savings: 0, investments: 0, budgetUsed: 0 },
    aiMessages: [],
    addXP: () => {},
    addMessage: () => {},
    clearMessages: () => {},
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
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
  render: () => (
    <UserProvider user={{ name: 'Neural Runner', level: 7, xp: 3240, xpToNextLevel: 5000, streak: 12, tokens: 2847, nfts: 6 }}>
      <XPBar />
    </UserProvider>
  ),
};

export const Low: Story = {
  render: () => (
    <UserProvider user={{ name: 'New Runner', level: 1, xp: 120, xpToNextLevel: 1000, streak: 0, tokens: 0, nfts: 0 }}>
      <XPBar />
    </UserProvider>
  ),
};

export const NearMax: Story = {
  render: () => (
    <UserProvider user={{ name: 'Veteran', level: 42, xp: 4999, xpToNextLevel: 5000, streak: 100, tokens: 99999, nfts: 1337 }}>
      <XPBar />
    </UserProvider>
  ),
};

export const MaxedOut: Story = {
  render: () => (
    <UserProvider user={{ name: 'Legend', level: 99, xp: 5000, xpToNextLevel: 5000, streak: 365, tokens: 1 << 30, nfts: 500 }}>
      <XPBar />
    </UserProvider>
  ),
};

export const ZeroXP: Story = {
  render: () => (
    <UserProvider user={{ name: 'Fresh', level: 1, xp: 0, xpToNextLevel: 1000, streak: 0, tokens: 0, nfts: 0 }}>
      <XPBar />
    </UserProvider>
  ),
};

export const Grid: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      <UserProvider user={{ name: 'Fresh', level: 1, xp: 0, xpToNextLevel: 1000, streak: 0, tokens: 0, nfts: 0 }}>
        <XPBar />
      </UserProvider>
      <UserProvider user={{ name: 'Runner', level: 7, xp: 3240, xpToNextLevel: 5000, streak: 12, tokens: 2847, nfts: 6 }}>
        <XPBar />
      </UserProvider>
      <UserProvider user={{ name: 'Veteran', level: 42, xp: 4999, xpToNextLevel: 5000, streak: 100, tokens: 99999, nfts: 1337 }}>
        <XPBar />
      </UserProvider>
    </View>
  ),
};