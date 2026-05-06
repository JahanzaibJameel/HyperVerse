import type { Meta, StoryObj } from '@storybook/react-native';
import { View, Text } from 'react-native';
import { useThemeStore } from '@/lib/stores/themeStore';
import { GlowCard } from './GlowCard';

const meta: Meta<typeof GlowCard> = {
  title: 'UI/GlowCard',
  component: GlowCard,
  argTypes: {
    children: {
      control: 'text',
      description: 'Content inside the card',
    },
    glowColor: {
      control: 'color',
      description: 'Color of the glow effect',
    },
    style: {
      control: 'object',
      description: 'Additional styles to apply',
    },
  },
  args: {
    children: 'Hello, HyperVerse!',
    glowColor: '#00ffff',
  },
};

type Story = StoryObj<typeof GlowCard>;

export const Default: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#fff' }}>
          Welcome to the future of personal productivity
        </Text>
      </View>
    ),
  },
};

export const WithCustomGlow: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#fff' }}>
          Custom purple glow effect
        </Text>
      </View>
    ),
    glowColor: '#a855f7',
  },
};

export const DarkTheme: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#fff' }}>
          Dark mode cyberpunk aesthetic
        </Text>
      </View>
    ),
    glowColor: '#00ffff',
  },
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#0a0a0a', padding: 40 }}>
        <Story />
      </View>
    ),
  ],
};

export const LightTheme: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#000' }}>
          Light mode variant
        </Text>
      </View>
    ),
    glowColor: '#10b981',
  },
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: '#f8f8f8', padding: 40 }}>
        <Story />
      </View>
    ),
  ],
};

export const Interactive: Story = {
  args: {
    children: (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#fff' }}>
          Press me for haptic feedback
        </Text>
      </View>
    ),
    glowColor: '#ec4899',
  },
  parameters: {
    onDeviceControls: {
      onPress: {
        action: 'pressed',
        description: 'Card pressed',
      },
    },
  },
};
