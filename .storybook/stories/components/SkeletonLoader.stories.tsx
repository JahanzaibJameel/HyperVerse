import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { SkeletonLoader } from '@/components/SkeletonLoader';

const meta = {
  title: 'Components/SkeletonLoader',
  component: SkeletonLoader,
  parameters: {
    docs: {
      description: {
        component:
          'A shimmering placeholder. Loops opacity between 0.3 and 0.8 for `animationDuration` '
          + 'milliseconds, then reverses. Use it while content loads rather than a spinner.',
      },
    },
  },
  args: {
    width: '100%',
    height: 20,
  },
} satisfies Meta<typeof SkeletonLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Taller: Story = {
  args: { height: 40 },
};

export const Short: Story = {
  args: { height: 8 },
};

export const FixedWidth: Story = {
  args: { width: 120, height: 24 },
};

export const Fast: Story = {
  args: { animationDuration: 400 },
};

export const Slow: Story = {
  args: { animationDuration: 2000 },
};

export const List: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      <SkeletonLoader height={20} />
      <SkeletonLoader height={20} />
      <SkeletonLoader height={20} />
      <SkeletonLoader height={20} />
      <SkeletonLoader height={20} />
    </View>
  ),
};

export const Card: Story = {
  render: () => (
    <View style={{ padding: 16, gap: 12 }}>
      <SkeletonLoader height={120} style={{ borderRadius: 12 }} />
      <SkeletonLoader height={16} width="60%" />
      <SkeletonLoader height={12} width="40%" />
    </View>
  ),
};