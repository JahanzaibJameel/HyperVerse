import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';

import { XPBar } from '../XPBar';

import React, { createContext, useContext } from 'react';

// Mock context for stories
const MockAppContext = createContext({
  user: {
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
  },
});

const MockAppProvider: React.FC<{ children: React.ReactNode; user?: any }> = ({ 
  children, 
  user = { level: 1, xp: 0, xpToNextLevel: 1000 }
}) => (
  <MockAppContext.Provider value={{ user }}>
    {children}
  </MockAppContext.Provider>
);

// Custom hook that uses our mock context
const useApp = () => useContext(MockAppContext);

// Override the original useApp in XPBar for stories
const XPBarWithMock = ({ user }: { user: any }) => {
  const MockXPBar = () => {
    // Re-implement XPBar logic with mock data
    const colors = {
      cyan: '#00ffff',
      purple: '#ff00ff',
      mutedForeground: '#888888',
      border: '#333333',
    };
    
    const progress = React.useRef(new Animated.Value(0)).current;
    const pct = user.xp / user.xpToNextLevel;

    React.useEffect(() => {
      Animated.timing(progress, {
        toValue: pct,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, [pct]);

    const barWidth = progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    const glowStyle = {
      shadowColor: colors.cyan,
      shadowOpacity: 0.9,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
    };

    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={[styles.level, { color: colors.cyan }]}>LVL {user.level}</Text>
          <Text style={[styles.xp, { color: colors.mutedForeground }]}>
            {user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()} XP
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.fillWrapper, { width: barWidth }]}>
            <LinearGradient
              colors={[colors.cyan, colors.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.fill, glowStyle]}
            />
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <MockAppProvider user={user}>
      <MockXPBar />
    </MockAppProvider>
  );
};

const meta: Meta<typeof XPBarWithMock> = {
  title: 'UI/XPBar',
  component: XPBarWithMock,
  argTypes: {
    user: {
      control: 'object',
      description: 'User data containing level, xp, and xpToNextLevel',
    },
  },
  args: {
    user: {
      level: 5,
      xp: 750,
      xpToNextLevel: 1000,
    },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 20, backgroundColor: '#000' }}>
        <Story />
      </View>
    ),
  ],
};

type Story = StoryObj<typeof XPBarWithMock>;

export const Default: Story = {
  args: {
    user: {
      level: 5,
      xp: 750,
      xpToNextLevel: 1000,
    },
  },
};

export const Beginner: Story = {
  args: {
    user: {
      level: 1,
      xp: 150,
      xpToNextLevel: 500,
    },
  },
};

export const Advanced: Story = {
  args: {
    user: {
      level: 25,
      xp: 4500,
      xpToNextLevel: 5000,
    },
  },
};

export const AlmostLevelUp: Story = {
  args: {
    user: {
      level: 10,
      xp: 990,
      xpToNextLevel: 1000,
    },
  },
};

export const JustStarted: Story = {
  args: {
    user: {
      level: 12,
      xp: 25,
      xpToNextLevel: 2000,
    },
  },
};

export const HighLevel: Story = {
  args: {
    user: {
      level: 50,
      xp: 25000,
      xpToNextLevel: 30000,
    },
  },
};

export const MaxLevel: Story = {
  args: {
    user: {
      level: 100,
      xp: 100000,
      xpToNextLevel: 100000,
    },
  },
};

export const Progression: Story = {
  render: () => (
    <View style={{ gap: 20 }}>
      <XPBarWithMock user={{ level: 1, xp: 0, xpToNextLevel: 100 }} />
      <XPBarWithMock user={{ level: 1, xp: 25, xpToNextLevel: 100 }} />
      <XPBarWithMock user={{ level: 1, xp: 50, xpToNextLevel: 100 }} />
      <XPBarWithMock user={{ level: 1, xp: 75, xpToNextLevel: 100 }} />
      <XPBarWithMock user={{ level: 2, xp: 0, xpToNextLevel: 200 }} />
    </View>
  ),
};

export default meta;

// Import necessary components and styles
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, StyleSheet, Text } from 'react-native';

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  level: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  xp: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fillWrapper: { height: '100%', overflow: 'hidden', borderRadius: 5 },
  fill: { flex: 1 },
});
