import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { LiveTicker } from '@/components/LiveTicker';

const meta = {
  title: 'Components/LiveTicker',
  component: LiveTicker,
  parameters: {
    docs: {
      description: {
        component:
          'A horizontally scrolling ticker strip. The track loops forever at 18 seconds per '
          + 'pass, so it reads as live. It measures its own width via onLayout, which is why the '
          + 'animation only starts once the component has been laid out.',
      },
    },
  },
} satisfies Meta<typeof LiveTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Narrow: Story = {
  render: () => (
    <View style={{ width: 300 }}>
      <LiveTicker />
    </View>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <View style={{ flex: 1 }}>
      <LiveTicker />
    </View>
  ),
};