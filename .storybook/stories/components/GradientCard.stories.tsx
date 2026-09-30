import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

import { GradientCard } from '@/components/GradientCard';

const meta = {
  title: 'Components/GradientCard',
  component: GradientCard,
  parameters: {
    docs: {
      description: {
        component:
          'A card whose background is a LinearGradient. When no `colors` prop is passed it falls '
          + 'back to the theme cyan→purple gradient at low opacity, tinted by the current palette.',
      },
    },
  },
  args: {
    children: 'Card content',
  },
} satisfies Meta<typeof GradientCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CyanPurple: Story = {
  args: {
    colors: ['#00e5ff', '#7c4dff'],
    children: (
      <View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Cyan to purple</Text>
        <Text style={{ color: '#ccc', marginTop: 6, fontSize: 12 }}>
          Explicit gradient colors.
        </Text>
      </View>
    ),
  },
};

export const PinkGreen: Story = {
  args: {
    colors: ['#ff2d95', '#00ff9d'],
    children: (
      <View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Pink to green</Text>
        <Text style={{ color: '#ccc', marginTop: 6, fontSize: 12 }}>
          A different direction.
        </Text>
      </View>
    ),
  },
};

export const Vertical: Story = {
  args: {
    colors: ['#00d4ff', '#7c3aed', '#ec4899'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    children: (
      <View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Vertical</Text>
        <Text style={{ color: '#ccc', marginTop: 6, fontSize: 12 }}>
          Three-stop gradient top to bottom.
        </Text>
      </View>
    ),
  },
};

export const Grid: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <GradientCard colors={['#00e5ff', '#7c4dff']}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Card 1</Text>
      </GradientCard>
      <GradientCard colors={['#ff2d95', '#00ff9d']}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Card 2</Text>
      </GradientCard>
      <GradientCard colors={['#00d4ff', '#ec4899', '#7c3aed']}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Card 3</Text>
      </GradientCard>
    </View>
  ),
};