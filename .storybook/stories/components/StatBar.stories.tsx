import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { StatBar } from '@/components/StatBar';

const meta = {
  title: 'Components/StatBar',
  component: StatBar,
  parameters: {
    docs: {
      description: {
        component:
          'A labelled progress bar. The fill animates from 0 to the value over 1 second, and '
          + 'clamps the percentage so a value above max renders a full bar.',
      },
    },
  },
  args: {
    label: 'Steps',
    value: 8432,
    max: 10000,
    color: '#00e5ff',
  },
} satisfies Meta<typeof StatBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Half: Story = {
  args: { label: 'Sleep', value: 3.7, max: 8, color: '#7c4dff' },
};

export const Full: Story = {
  args: { label: 'Goal', value: 100, max: 100, color: '#00ff9d' },
};

export const OverMax: Story = {
  args: { label: 'Over max', value: 120, max: 100, color: '#ff2d95' },
};

export const Zero: Story = {
  args: { label: 'Nothing yet', value: 0, max: 100, color: '#ffb800' },
};

export const WithUnit: Story = {
  args: { label: 'Heart rate', value: 68, max: 220, unit: 'bpm', color: '#ff006e' },
};

export const NoLabel: Story = {
  args: { label: '', value: 75, max: 100, color: '#00d4ff' },
};

export const Grid: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <StatBar label="Steps" value={8432} max={10000} color="#00e5ff" />
      <StatBar label="Sleep" value={7.4} max={8} color="#7c4dff" />
      <StatBar label="Calories" value={1840} max={2500} color="#ff2d95" />
      <StatBar label="Workouts" value={3} max={7} color="#00ff9d" />
    </View>
  ),
};