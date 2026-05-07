import type { Meta, StoryObj } from '@storybook/react-native';
import { View, Text } from 'react-native';

import { NeonButton } from './NeonButton';

import { useThemeStore } from '@/lib/stores/themeStore';

const meta: Meta<typeof NeonButton> = {
  title: 'UI/NeonButton',
  component: NeonButton,
  argTypes: {
    title: {
      control: 'text',
      description: 'Button text',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline'],
      description: 'Button variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    icon: {
      control: 'text',
      description: 'Icon name (if any)',
    },
    onPress: {
      action: 'pressed',
      description: 'Button pressed',
    },
  },
  args: {
    title: 'Get Started',
    variant: 'primary',
    size: 'md',
  },
};

type Story = StoryObj<typeof NeonButton>;

export const Primary: Story = {
  args: {
    title: 'Primary Action',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    title: 'Secondary Action',
    variant: 'secondary',
    size: 'md',
  },
};

export const Ghost: Story = {
  args: {
    title: 'Ghost Button',
    variant: 'ghost',
    size: 'md',
  },
};

export const Outline: Story = {
  args: {
    title: 'Outline Button',
    variant: 'outline',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    title: 'Small',
    variant: 'primary',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    title: 'Large Button',
    variant: 'primary',
    size: 'lg',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'With Icon',
    variant: 'primary',
    size: 'md',
    icon: 'rocket',
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading...',
    variant: 'primary',
    size: 'md',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    title: 'Disabled',
    variant: 'primary',
    size: 'md',
    disabled: true,
  },
};

export const DarkTheme: Story = {
  args: {
    title: 'Dark Theme',
    variant: 'primary',
    size: 'md',
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
    title: 'Light Theme',
    variant: 'primary',
    size: 'md',
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
    title: 'Press Me',
    variant: 'primary',
    size: 'md',
  },
  parameters: {
    onDeviceControls: {
      onPress: {
        action: 'button-pressed',
        description: 'Button was pressed',
      },
    },
  },
};
