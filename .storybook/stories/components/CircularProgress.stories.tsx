import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { CircularProgress } from '@/components/CircularProgress';

const meta = {
  title: 'Components/CircularProgress',
  component: CircularProgress,
  parameters: {
    docs: {
      description: {
        component:
          'A circular progress arc with a centered value and label. The arc animates from 0 '
          + 'to the percentage over 1.2 seconds. Values above 1,000 are rendered as thousands.',
      },
    },
  },
  args: {
    value: 8432,
    max: 10000,
    color: '#00e5ff',
    label: 'Steps',
  },
} satisfies Meta<typeof CircularProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Half: Story = {
  args: { value: 4000, max: 8000, label: 'Sleep', color: '#7c4dff' },
};

export const Full: Story = {
  args: { value: 100, max: 100, label: 'Goal', color: '#00ff9d' },
};

export const OverMax: Story = {
  args: { value: 120, max: 100, label: 'Over', color: '#ff2d95' },
};

export const Zero: Story = {
  args: { value: 0, max: 100, label: 'Start', color: '#ffb800' },
};

export const WithUnit: Story = {
  args: { value: 68, max: 220, unit: 'bpm', label: 'Heart', color: '#ff006e' },
};

export const Thousands: Story = {
  args: { value: 843200, max: 1000000, label: 'Tokens', color: '#00d4ff' },
};

export const Grid: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
      <CircularProgress value={8432} max={10000} color="#00e5ff" label="Steps" />
      <CircularProgress value={7.4} max={8} color="#7c4dff" label="Sleep" />
      <CircularProgress value={1840} max={2500} color="#ff2d95" label="Calories" />
      <CircularProgress value={3} max={7} color="#00ff9d" label="Workouts" />
    </View>
  ),
};