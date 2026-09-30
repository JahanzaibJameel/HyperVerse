import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { NeonButton } from '@/components/NeonButton';

const meta = {
  title: 'Components/NeonButton',
  component: NeonButton,
  parameters: {
    docs: {
      description: {
        component:
          'An outlined or filled neon button. Pressing it runs a 80ms scale-down animation and '
          + 'triggers a light haptic. Disabling it dims it to 0.5 opacity.',
      },
    },
  },
  args: {
    label: 'Submit',
    onPress: () => {},
  },
} satisfies Meta<typeof NeonButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { color: '#00e5ff' },
};

export const Filled: Story = {
  args: { color: '#00e5ff', filled: true, label: 'Filled' },
};

export const Sizes: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      <NeonButton label="Small" size="sm" color="#00e5ff" onPress={() => {}} />
      <NeonButton label="Medium" size="md" color="#00e5ff" onPress={() => {}} />
      <NeonButton label="Large" size="lg" color="#00e5ff" onPress={() => {}} />
    </View>
  ),
};

export const Colors: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      <NeonButton label="Cyan" color="#00e5ff" onPress={() => {}} />
      <NeonButton label="Pink" color="#ff2d95" onPress={() => {}} />
      <NeonButton label="Purple" color="#7c4dff" onPress={() => {}} />
      <NeonButton label="Green" color="#00ff9d" onPress={() => {}} />
    </View>
  ),
};

export const Disabled: Story = {
  args: { color: '#00e5ff', disabled: true, label: 'Disabled' },
};

export const DisabledFilled: Story = {
  args: { color: '#00e5ff', filled: true, disabled: true, label: 'Disabled' },
};

export const LongLabel: Story = {
  args: { color: '#ff2d95', label: 'Accept terms and continue to the next screen' },
};