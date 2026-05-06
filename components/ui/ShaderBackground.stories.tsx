import type { Meta, StoryObj } from '@storybook/react-native';
import { View, Text } from 'react-native';
import { ShaderBackground } from './ShaderBackground';

const meta: Meta<typeof ShaderBackground> = {
  title: 'UI/ShaderBackground',
  component: ShaderBackground,
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display over shader effect',
    },
    shaderType: {
      control: 'select',
      options: ['cyberpunk', 'matrix', 'wave', 'plasma'],
      description: 'Type of shader effect',
    },
    primaryColor: {
      control: 'color',
      description: 'Primary color for shader',
    },
    secondaryColor: {
      control: 'color', 
      description: 'Secondary accent color',
    },
    intensity: {
      control: 'range',
      min: 0.1,
      max: 1,
      step: 0.1,
      description: 'Intensity of the effect',
    },
    animationSpeed: {
      control: 'range',
      min: 0.5,
      max: 3,
      step: 0.5,
      description: 'Animation speed multiplier',
    },
  },
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#fff', textAlign: 'center' }}>
          Cyberpunk Shader Background
        </Text>
      </View>
    ),
    shaderType: 'cyberpunk',
    primaryColor: '#00ffff',
    secondaryColor: '#a855f7',
    intensity: 0.7,
    animationSpeed: 1.5,
  },
};

type Story = StoryObj<typeof ShaderBackground>;

export const Cyberpunk: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#fff', textAlign: 'center' }}>
          Classic Cyberpunk Glow
        </Text>
      </View>
    ),
    shaderType: 'cyberpunk',
    primaryColor: '#00ffff',
    secondaryColor: '#ff00ff',
    intensity: 0.8,
    animationSpeed: 2,
  },
};

export const Matrix: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#00ff00', textAlign: 'center' }}>
          Matrix Digital Rain
        </Text>
      </View>
    ),
    shaderType: 'matrix',
    primaryColor: '#00ff00',
    secondaryColor: '#00ff88',
    intensity: 0.6,
    animationSpeed: 1,
  },
};

export const Wave: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#ffffff', textAlign: 'center' }}>
          Liquid Wave Effect
        </Text>
      </View>
    ),
    shaderType: 'wave',
    primaryColor: '#0099ff',
    secondaryColor: '#0066cc',
    intensity: 0.5,
    animationSpeed: 0.8,
  },
};

export const Plasma: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#ff6600', textAlign: 'center' }}>
          Plasma Energy Field
        </Text>
      </View>
    ),
    shaderType: 'plasma',
    primaryColor: '#ff6600',
    secondaryColor: '#ffcc00',
    intensity: 0.9,
    animationSpeed: 1.2,
  },
};

export const Interactive: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#fff', textAlign: 'center' }}>
          Touch to change intensity
        </Text>
      </View>
    ),
    shaderType: 'cyberpunk',
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    intensity: 0.5,
    animationSpeed: 1,
  },
  parameters: {
    onDeviceControls: {
      intensity: {
        action: 'intensity-changed',
        description: 'Shader intensity adjusted',
      },
      primaryColor: {
        action: 'color-changed',
        description: 'Primary color changed',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#00ffff', textAlign: 'center' }}>
          Dark Mode Cyberpunk
        </Text>
      </View>
    ),
    shaderType: 'cyberpunk',
    primaryColor: '#00ffff',
    secondaryColor: '#ff00ff',
    intensity: 0.9,
    animationSpeed: 1.5,
  },
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#000', padding: 40 }}>
        <Story />
      </View>
    ),
  ],
};

export const LightTheme: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#000', textAlign: 'center' }}>
          Light Mode Variant
        </Text>
      </View>
    ),
    shaderType: 'cyberpunk',
    primaryColor: '#10b981',
    secondaryColor: '#065f46',
    intensity: 0.4,
    animationSpeed: 1.2,
  },
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#f0f0f0', padding: 40 }}>
        <Story />
      </View>
    ),
  ],
};
