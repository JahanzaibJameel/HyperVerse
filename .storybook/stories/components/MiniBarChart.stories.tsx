import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { MiniBarChart } from '@/components/MiniBarChart';

const meta = {
  title: 'Components/MiniBarChart',
  component: MiniBarChart,
  parameters: {
    docs: {
      description: {
        component:
          'A small vertical bar chart built on react-native-svg. Bars are height-scaled to the '
          + 'maximum value in the dataset, with a minimum of 4px so short bars stay visible. '
          + '`accentIndex` highlights one bar in full opacity.',
      },
    },
  },
  args: {
    data: [20, 45, 60, 35, 80, 55, 70],
    color: '#00e5ff',
  },
} satisfies Meta<typeof MiniBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabels: Story = {
  args: {
    data: [20, 45, 60, 35, 80, 55, 70],
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    color: '#00e5ff',
    accentIndex: 4,
  },
};

export const AccentLast: Story = {
  args: {
    data: [10, 20, 30, 40, 50],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    color: '#ff2d95',
    accentIndex: 4,
  },
};

export const Flat: Story = {
  args: { data: [5, 5, 5, 5, 5], color: '#7c4dff' },
};

export const Single: Story = {
  args: { data: [100], color: '#00ff9d' },
};

export const Short: Story = {
  args: { data: [2, 3, 1], color: '#ffb800', height: 60 },
};

export const Tall: Story = {
  args: { data: [20, 45, 60, 35, 80, 55, 70], color: '#00d4ff', height: 140 },
};

export const Grid: Story = {
  render: () => (
    <View style={{ gap: 20 }}>
      <MiniBarChart data={[20, 45, 60, 35, 80, 55, 70]} color="#00e5ff" accentIndex={4} />
      <MiniBarChart data={[10, 20, 30, 40, 50]} labels={['Jan', 'Feb', 'Mar', 'Apr', 'May']} color="#ff2d95" accentIndex={4} />
      <MiniBarChart data={[30, 60, 40, 90, 70, 50, 80]} color="#7c4dff" />
    </View>
  ),
};