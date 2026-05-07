import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';

import { CircularProgress } from '../CircularProgress';

const meta: Meta<typeof CircularProgress> = {
  title: 'UI/CircularProgress',
  component: CircularProgress,
  argTypes: {
    value: {
      control: 'number',
      description: 'Current progress value',
      min: 0,
      max: 1000,
    },
    max: {
      control: 'number',
      description: 'Maximum value',
      min: 1,
      max: 1000,
    },
    size: {
      control: 'number',
      description: 'Diameter of the progress circle',
      min: 50,
      max: 200,
    },
    strokeWidth: {
      control: 'number',
      description: 'Thickness of the progress stroke',
      min: 2,
      max: 20,
    },
    color: {
      control: 'color',
      description: 'Primary color for the progress',
    },
    label: {
      control: 'text',
      description: 'Label displayed below the value',
    },
    unit: {
      control: 'text',
      description: 'Unit displayed after the value',
    },
  },
  args: {
    value: 750,
    max: 1000,
    size: 90,
    strokeWidth: 8,
    color: '#00ffff',
    label: 'ENERGY',
    unit: 'kW',
  },
};

type Story = StoryObj<typeof CircularProgress>;

export const Default: Story = {
  args: {
    value: 750,
    max: 1000,
    size: 90,
    strokeWidth: 8,
    color: '#00ffff',
    label: 'ENERGY',
    unit: 'kW',
  },
};

export const Health: Story = {
  args: {
    value: 85,
    max: 100,
    size: 100,
    strokeWidth: 10,
    color: '#00ff88',
    label: 'HEALTH',
    unit: '%',
  },
};

export const XP: Story = {
  args: {
    value: 2340,
    max: 5000,
    size: 80,
    strokeWidth: 6,
    color: '#ff00ff',
    label: 'XP',
    unit: '',
  },
};

export const LowProgress: Story = {
  args: {
    value: 25,
    max: 100,
    size: 120,
    strokeWidth: 12,
    color: '#ff6b6b',
    label: 'BATTERY',
    unit: '%',
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    max: 100,
    size: 90,
    strokeWidth: 8,
    color: '#00ff00',
    label: 'SYNC',
    unit: '%',
  },
};

export const Large: Story = {
  args: {
    value: 15000,
    max: 20000,
    size: 150,
    strokeWidth: 15,
    color: '#ffaa00',
    label: 'STORAGE',
    unit: 'GB',
  },
};

export const Small: Story = {
  args: {
    value: 42,
    max: 60,
    size: 60,
    strokeWidth: 4,
    color: '#00ccff',
    label: 'FPS',
    unit: '',
  },
};

export const AnimatedDemo: Story = {
  args: {
    value: 0,
    max: 100,
    size: 100,
    strokeWidth: 10,
    color: '#00ffff',
    label: 'LOADING',
    unit: '%',
  },
  parameters: {
    onDeviceControls: {
      value: {
        action: 'value-changed',
        description: 'Progress value updated',
      },
    },
  },
};

export const MultipleMetrics: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20 }}>
      <CircularProgress
        value={85}
        max={100}
        size={80}
        strokeWidth={6}
        color="#00ff88"
        label="HEALTH"
        unit="%"
      />
      <CircularProgress
        value={750}
        max={1000}
        size={80}
        strokeWidth={6}
        color="#00ffff"
        label="ENERGY"
        unit="kW"
      />
      <CircularProgress
        value={2340}
        max={5000}
        size={80}
        strokeWidth={6}
        color="#ff00ff"
        label="XP"
        unit=""
      />
    </View>
  ),
};

export default meta;
