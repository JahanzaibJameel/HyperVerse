import type { Meta, StoryObj } from '@storybook/react-native';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';

import { GlowCard } from '../GlowCard';
import { CircularProgress } from '../CircularProgress';
import { XPBar } from '../XPBar';
import { MiniBarChart } from '../MiniBarChart';

import { ShaderBackground } from './ShaderBackground';

// Mock XPBar component for stories
const MockXPBar = ({ user }: { user: any }) => {
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
      useNativeDriver: Platform.OS !== "web",
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
    <View style={xpBarStyles.container}>
      <View style={xpBarStyles.row}>
        <Text style={[xpBarStyles.level, { color: colors.cyan }]}>LVL {user.level}</Text>
        <Text style={[xpBarStyles.xp, { color: colors.mutedForeground }]}>
          {user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()} XP
        </Text>
      </View>
      <View style={[xpBarStyles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[xpBarStyles.fillWrapper, { width: barWidth }]}>
          <LinearGradient
            colors={[colors.cyan, colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[xpBarStyles.fill, glowStyle]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const meta: Meta<typeof View> = {
  title: 'UI/Dashboard',
  component: View,
  decorators: [
    (Story) => (
      <ShaderBackground shaderType="cyberpunk" intensity={0.3}>
        <ScrollView style={dashboardStyles.container} contentContainerStyle={dashboardStyles.content}>
          <Story />
        </ScrollView>
      </ShaderBackground>
    ),
  ],
};

type Story = StoryObj<typeof View>;

export const StatsOverview: Story = {
  render: () => (
    <View style={dashboardStyles.grid}>
      <GlowCard intensity="high" glowColor="#00ffff">
        <Text style={dashboardStyles.cardTitle}>System Status</Text>
        <View style={dashboardStyles.statsRow}>
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
        </View>
      </GlowCard>

      <GlowCard intensity="medium" glowColor="#ff00ff">
        <Text style={dashboardStyles.cardTitle}>Performance</Text>
        <MiniBarChart
          data={[65, 78, 90, 81, 56, 85, 70]}
          labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']}
          color="#ff00ff"
          accentIndex={2}
        />
      </GlowCard>
    </View>
  ),
};

export const PlayerProgress: Story = {
  render: () => (
    <View style={dashboardStyles.grid}>
      <GlowCard intensity="high" glowColor="#ffaa00">
        <Text style={dashboardStyles.cardTitle}>Level Progress</Text>
        <MockXPBar user={{ level: 12, xp: 3450, xpToNextLevel: 5000 }} />
        <View style={dashboardStyles.statsRow}>
          <CircularProgress
            value={2340}
            max={5000}
            size={70}
            strokeWidth={5}
            color="#ff00ff"
            label="XP"
            unit=""
          />
          <CircularProgress
            value={42}
            max={60}
            size={70}
            strokeWidth={5}
            color="#00ccff"
            label="QUESTS"
            unit=""
          />
        </View>
      </GlowCard>

      <GlowCard intensity="medium" glowColor="#00ff88">
        <Text style={dashboardStyles.cardTitle}>Achievements</Text>
        <View style={dashboardStyles.achievementList}>
          <Text style={dashboardStyles.achievementItem}>🏆 Cyber Master</Text>
          <Text style={dashboardStyles.achievementItem}>⚡ Energy Saver</Text>
          <Text style={dashboardStyles.achievementItem}>🎯 Sharpshooter</Text>
        </View>
      </GlowCard>
    </View>
  ),
};

export const AnalyticsPanel: Story = {
  render: () => (
    <View style={dashboardStyles.grid}>
      <GlowCard intensity="medium" glowColor="#00ffff">
        <Text style={dashboardStyles.cardTitle}>Weekly Activity</Text>
        <MiniBarChart
          data={[120, 150, 180, 90, 200, 160, 140]}
          labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
          color="#00ffff"
          accentIndex={4}
        />
      </GlowCard>

      <GlowCard intensity="low" glowColor="#ff00ff">
        <Text style={dashboardStyles.cardTitle}>Resource Usage</Text>
        <View style={dashboardStyles.resourceList}>
          <View style={dashboardStyles.resourceItem}>
            <CircularProgress
              value={65}
              max={100}
              size={50}
              strokeWidth={4}
              color="#ff6b6b"
              label="CPU"
              unit="%"
            />
          </View>
          <View style={dashboardStyles.resourceItem}>
            <CircularProgress
              value={42}
              max={100}
              size={50}
              strokeWidth={4}
              color="#4ecdc4"
              label="RAM"
              unit="%"
            />
          </View>
        </View>
      </GlowCard>
    </View>
  ),
};

export const FullDashboard: Story = {
  render: () => (
    <View style={dashboardStyles.fullGrid}>
      <GlowCard intensity="high" glowColor="#00ffff">
        <Text style={dashboardStyles.cardTitle}>Player Stats</Text>
        <MockXPBar user={{ level: 15, xp: 6750, xpToNextLevel: 8000 }} />
        <View style={dashboardStyles.statsRow}>
          <CircularProgress
            value={92}
            max={100}
            size={60}
            strokeWidth={5}
            color="#00ff88"
            label="HEALTH"
            unit="%"
          />
          <CircularProgress
            value={850}
            max={1000}
            size={60}
            strokeWidth={5}
            color="#00ffff"
            label="ENERGY"
            unit="kW"
          />
          <CircularProgress
            value={45}
            max={60}
            size={60}
            strokeWidth={5}
            color="#ff00ff"
            label="SKILLS"
            unit=""
          />
        </View>
      </GlowCard>

      <GlowCard intensity="medium" glowColor="#ff00ff">
        <Text style={dashboardStyles.cardTitle}>Performance Metrics</Text>
        <MiniBarChart
          data={[85, 92, 78, 95, 88, 91, 87]}
          labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']}
          color="#ff00ff"
          accentIndex={3}
        />
      </GlowCard>

      <GlowCard intensity="low" glowColor="#00ff88">
        <Text style={dashboardStyles.cardTitle}>System Resources</Text>
        <View style={dashboardStyles.resourceList}>
          <CircularProgress
            value={72}
            max={100}
            size={55}
            strokeWidth={4}
            color="#ff6b6b"
            label="CPU"
            unit="%"
          />
          <CircularProgress
            value={58}
            max={100}
            size={55}
            strokeWidth={4}
            color="#4ecdc4"
            label="RAM"
            unit="%"
          />
          <CircularProgress
            value={34}
            max={100}
            size={55}
            strokeWidth={4}
            color="#ffd93d"
            label="STORAGE"
            unit="%"
          />
        </View>
      </GlowCard>
    </View>
  ),
};

export default meta;

// Styles
const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  grid: {
    gap: 16,
  },
  fullGrid: {
    gap: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
  },
  achievementList: {
    gap: 8,
  },
  achievementItem: {
    fontSize: 14,
    color: '#ffffff',
    paddingVertical: 4,
  },
  resourceList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  resourceItem: {
    alignItems: 'center',
  },
});

const xpBarStyles = StyleSheet.create({
  container: { marginVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  level: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1, color: '#00ffff' },
  xp: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#888888' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#333333' },
  fillWrapper: { height: '100%', overflow: 'hidden', borderRadius: 5 },
  fill: { flex: 1 },
});

// Import necessary components
