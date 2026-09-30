import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { ShaderBackground } from '@/components/ui/ShaderBackground';

const meta = {
  title: 'Components/ShaderBackground',
  component: ShaderBackground,
  parameters: {
    docs: {
      description: {
        component:
          'Animated gradient backdrop. Runs on the UI thread via Reanimated and loops forever. '
          + 'It is absolutely positioned and has `pointerEvents: none`, so it sits behind content '
          + 'without intercepting touches.',
      },
    },
  },
  args: {
    children: (
      <View style={{ padding: 24 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>Content on top</Text>
        <Text style={{ color: '#ccc', marginTop: 8, fontSize: 13 }}>
          The shader animates behind this text.
        </Text>
      </View>
    ),
  },
} satisfies Meta<typeof ShaderBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cyberpunk: Story = {
  args: { shaderType: 'cyberpunk', primaryColor: '#00ffff', intensity: 0.7 },
};

export const Matrix: Story = {
  args: { shaderType: 'matrix', primaryColor: '#00ff41', intensity: 0.8 },
};

export const Wave: Story = {
  args: { shaderType: 'wave', primaryColor: '#00d4ff', intensity: 0.7 },
};

export const Plasma: Story = {
  args: { shaderType: 'plasma', primaryColor: '#7c3aed', intensity: 0.8 },
};

export const Fast: Story = {
  args: { shaderType: 'wave', animationSpeed: 3, intensity: 0.6 },
};

export const Slow: Story = {
  args: { shaderType: 'cyberpunk', animationSpeed: 0.3, intensity: 0.5 },
};

export const LowIntensity: Story = {
  args: { shaderType: 'plasma', intensity: 0.2 },
};

export const HighIntensity: Story = {
  args: { shaderType: 'matrix', intensity: 1 },
};

export const WithCallbacks: Story = {
  args: {
    shaderType: 'wave',
    intensity: 0.7,
    onIntensityChange: (i) => console.log('intensity', i),
    onColorChange: (c) => console.log('color', c),
  },
};