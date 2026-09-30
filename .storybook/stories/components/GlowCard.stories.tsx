import { View, Text } from 'react-native';
import type { Meta } from '@storybook/react';

import { GlowCard } from '@/components/GlowCard';

const meta = {
  title: 'Components/GlowCard',
  component: GlowCard,
  parameters: {
    docs: {
      description: {
        component:
          'A card with a glow border. On iOS it wraps the content in a BlurView; on other '
          + 'platforms it renders a bordered box with a shadow.',
      },
    },
  },
  args: {
    children: 'Card body text',
  },
} satisfies Meta<typeof GlowCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    glowColor: '#00e5ff',
    intensity: 'medium',
  },
};

export const LowIntensity: Story = {
  args: {
    glowColor: '#00e5ff',
    intensity: 'low',
    children: 'A subtle glow.',
  },
};

export const HighIntensity: Story = {
  args: {
    glowColor: '#ff2d95',
    intensity: 'high',
    children: 'A strong glow.',
  },
};

export const Pressable: Story = {
  args: {
    glowColor: '#00e5ff',
    onPress: () => {},
    children: 'Tap me',
  },
};

export const WithCustomContent: Story = {
  args: {
    glowColor: '#7c4dff',
    intensity: 'medium',
    children: (
      <View>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Title</Text>
        <Text style={{ opacity: 0.7, marginTop: 4 }}>Sub-text</Text>
      </View>
    ),
  },
};