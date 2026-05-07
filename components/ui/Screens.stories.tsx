import type { Meta, StoryObj } from '@storybook/react-native';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import React from 'react';

import { GlowCard } from '../GlowCard';
import { CircularProgress } from '../CircularProgress';
import { MiniBarChart } from '../MiniBarChart';

import { ShaderBackground } from './ShaderBackground';

const meta: Meta<typeof View> = {
  title: 'UI/Screens',
  component: View,
};

type Story = StoryObj<typeof View>;

// Home Screen Story
export const HomeScreen: Story = {
  render: () => (
    <ShaderBackground shaderType="cyberpunk" intensity={0.3}>
      <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content}>
        {/* Header */}
        <View style={screenStyles.header}>
          <View>
            <Text style={screenStyles.greeting}>GOOD MORNING</Text>
            <Text style={screenStyles.username}>Alex Chen</Text>
          </View>
          <View style={[screenStyles.notificationDot, { backgroundColor: '#ff00ff' }]} />
        </View>

        {/* Hero Card */}
        <GlowCard intensity="high" glowColor="#00ffff">
          <View style={screenStyles.heroContent}>
            <View style={[screenStyles.levelBadge, { backgroundColor: '#00ffff22', borderColor: '#00ffff44' }]}>
              <Text style={[screenStyles.levelText, { color: '#00ffff' }]}>LVL 15</Text>
            </View>
            <View style={screenStyles.streakRow}>
              <Text style={[screenStyles.streakText, { color: '#ffb800' }]}>🔥 12 STREAK</Text>
            </View>
            <View style={[screenStyles.tokenRow, { backgroundColor: '#ffb80015' }]}>
              <Text style={[screenStyles.tokenText, { color: '#ffb800' }]}>2,450</Text>
            </View>
          </View>
          
          <View style={screenStyles.statsRow}>
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

        {/* Quick Stats */}
        <View style={screenStyles.statsGrid}>
          {[
            { icon: "👟", val: "8,432", label: "STEPS", color: "#00ff88" },
            { icon: "❤️", val: "72", label: "BPM", color: "#ff6b6b" },
            { icon: "🌙", val: "7.4h", label: "SLEEP", color: "#00ffff" },
            { icon: "🎯", val: "24", label: "NFTs", color: "#ff00ff" },
          ].map((s, i) => (
            <GlowCard key={i} style={screenStyles.statCard} glowColor={s.color}>
              <Text style={screenStyles.statIcon}>{s.icon}</Text>
              <Text style={[screenStyles.statValue, { color: '#ffffff' }]}>{s.val}</Text>
              <Text style={[screenStyles.statLabel, { color: '#888888' }]}>{s.label}</Text>
            </GlowCard>
          ))}
        </View>

        {/* Performance Chart */}
        <GlowCard intensity="medium" glowColor="#ff00ff">
          <Text style={[screenStyles.cardTitle, { color: '#ffffff' }]}>Weekly Performance</Text>
          <MiniBarChart
            data={[85, 92, 78, 95, 88, 91, 87]}
            labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']}
            color="#ff00ff"
            accentIndex={3}
          />
        </GlowCard>
      </ScrollView>
    </ShaderBackground>
  ),
};

// AI Chat Screen Story
export const AIChatScreen: Story = {
  render: () => (
    <View style={[screenStyles.container, { backgroundColor: '#0a0a0a' }]}>
      {/* Header */}
      <View style={[screenStyles.chatHeader, { borderBottomColor: '#333333' }]}>
        <View style={screenStyles.aiAvatar}>
          <Text style={screenStyles.aiIcon}>🧠</Text>
        </View>
        <View style={screenStyles.aiInfo}>
          <Text style={[screenStyles.aiName, { color: '#ffffff' }]}>HyperVerse AI</Text>
          <View style={screenStyles.statusRow}>
            <View style={[screenStyles.statusDot, { backgroundColor: '#00ff88' }]} />
            <Text style={[screenStyles.statusText, { color: '#00ff88' }]}>Contextual memory active</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={screenStyles.messagesContainer} contentContainerStyle={screenStyles.messagesContent}>
        <View style={[screenStyles.messageBubble, { backgroundColor: '#1a1a1a', borderColor: '#ff00ff44', alignSelf: 'flex-start' }]}>
          <Text style={screenStyles.messageIcon}>🧠</Text>
          <Text style={[screenStyles.messageText, { color: '#ffffff' }]}>
            Neural analysis complete. Based on your 7.4h sleep data and cortisol peak window (7-9 AM):
            
            • 6:30 — Wake + cold exposure (2 min)
            • 6:45 — Meditation (10 min) +75 XP
            • 7:00 — HIIT training (25 min) +150 XP
            • 7:30 — High-protein breakfast
            • 8:00 — Deep focus block
            
            This sequence optimizes for your biometric patterns. Estimated daily XP gain: +320.
          </Text>
        </View>

        <View style={[screenStyles.messageBubble, { backgroundColor: '#00ffff20', borderColor: '#00ffff44', alignSelf: 'flex-end' }]}>
          <Text style={[screenStyles.messageText, { color: '#ffffff' }]}>Optimize my morning routine</Text>
        </View>

        <View style={[screenStyles.messageBubble, { backgroundColor: '#1a1a1a', borderColor: '#ff00ff44', alignSelf: 'flex-start' }]}>
          <Text style={screenStyles.messageIcon}>🧠</Text>
          <Text style={[screenStyles.messageText, { color: '#ffffff' }]}>
            Financial quantum scan complete:
            
            • Net worth: $24,680 (+13% MoM)
            • Savings rate: 62% — exceptional
            • Crypto portfolio: outperforming S&P by 4.2%
            • 3 unused subscriptions found (-$57/mo)
            
            Recommendation: Allocate 15% of next paycheck to index funds.
          </Text>
        </View>
      </ScrollView>

      {/* Quick Prompts */}
      <ScrollView horizontal style={screenStyles.promptsContainer} contentContainerStyle={screenStyles.promptsContent}>
        {["Optimize my morning routine", "Analyze my finances", "Plan my workout", "Check IoT status"].map((prompt, i) => (
          <View key={i} style={[screenStyles.promptChip, { backgroundColor: '#1a1a1a', borderColor: '#333333' }]}>
            <Text style={[screenStyles.promptText, { color: '#888888' }]}>{prompt}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={[screenStyles.inputContainer, { backgroundColor: '#1a1a1a', borderTopColor: '#333333' }]}>
        <View style={[screenStyles.voiceButton, { backgroundColor: '#2a2a2a', borderColor: '#333333' }]}>
          <Text style={screenStyles.voiceIcon}>🎤</Text>
        </View>
        <View style={[screenStyles.textInput, { backgroundColor: '#2a2a2a', borderColor: '#333333' }]}>
          <Text style={[screenStyles.placeholderText, { color: '#666666' }]}>Ask neural mesh...</Text>
        </View>
        <View style={[screenStyles.sendButton, { backgroundColor: '#ff00ff' }]}>
          <Text style={screenStyles.sendIcon}>➤</Text>
        </View>
      </View>
    </View>
  ),
};

// Settings Screen Story
export const SettingsScreen: Story = {
  render: () => (
    <ShaderBackground shaderType="wave" intensity={0.2}>
      <ScrollView style={screenStyles.container} contentContainerStyle={screenStyles.content}>
        <Text style={[screenStyles.screenTitle, { color: '#ffffff' }]}>SETTINGS</Text>

        {/* Profile Section */}
        <GlowCard intensity="medium" glowColor="#00ffff">
          <Text style={[screenStyles.sectionTitle, { color: '#ffffff' }]}>PROFILE</Text>
          <View style={screenStyles.profileRow}>
            <View style={[screenStyles.avatar, { backgroundColor: '#00ffff22', borderColor: '#00ffff' }]}>
              <Text style={screenStyles.avatarText}>AC</Text>
            </View>
            <View style={screenStyles.profileInfo}>
              <Text style={[screenStyles.profileName, { color: '#ffffff' }]}>Alex Chen</Text>
              <Text style={[screenStyles.profileSub, { color: '#888888' }]}>Level 15 • Cyber Pioneer</Text>
            </View>
          </View>
        </GlowCard>

        {/* Preferences */}
        <GlowCard intensity="low" glowColor="#ff00ff">
          <Text style={[screenStyles.sectionTitle, { color: '#ffffff' }]}>PREFERENCES</Text>
          {[
            { label: "Haptic Feedback", value: "Enabled", color: "#00ff88" },
            { label: "AI Suggestions", value: "Personalized", color: "#ff00ff" },
            { label: "AR Overlays", value: "Auto", color: "#00ffff" },
            { label: "Data Sync", value: "Real-time", color: "#ffb800" },
          ].map((item, i) => (
            <View key={i} style={[screenStyles.settingRow, { borderBottomColor: '#333333', borderBottomWidth: i < 3 ? 1 : 0 }]}>
              <Text style={[screenStyles.settingLabel, { color: '#ffffff' }]}>{item.label}</Text>
              <Text style={[screenStyles.settingValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </GlowCard>

        {/* System Status */}
        <GlowCard intensity="low" glowColor="#00ff88">
          <Text style={[screenStyles.sectionTitle, { color: '#ffffff' }]}>SYSTEM STATUS</Text>
          <View style={screenStyles.statusGrid}>
            {[
              { label: "CPU", value: "42%", color: "#00ff88" },
              { label: "Memory", value: "68%", color: "#ffb800" },
              { label: "Storage", value: "34%", color: "#00ffff" },
              { label: "Network", value: "Excellent", color: "#00ff88" },
            ].map((stat, i) => (
              <View key={i} style={screenStyles.statusItem}>
                <CircularProgress
                  value={parseInt(stat.value)}
                  max={100}
                  size={50}
                  strokeWidth={4}
                  color={stat.color}
                  label={stat.label}
                  unit={stat.value.includes('%') ? '%' : ''}
                />
              </View>
            ))}
          </View>
        </GlowCard>

        {/* Actions */}
        <GlowCard intensity="medium" glowColor="#ff6b6b">
          <Text style={[screenStyles.sectionTitle, { color: '#ffffff' }]}>ACTIONS</Text>
          {["Clear Cache", "Export Data", "Reset Preferences", "Sign Out"].map((action, i) => (
            <View key={i} style={[screenStyles.actionRow, { borderBottomColor: '#333333', borderBottomWidth: i < 3 ? 1 : 0 }]}>
              <Text style={[screenStyles.actionText, { color: '#ff6b6b' }]}>{action}</Text>
              <Text style={screenStyles.actionArrow}>→</Text>
            </View>
          ))}
        </GlowCard>
      </ScrollView>
    </ShaderBackground>
  ),
};

export default meta;

// Styles
const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
    color: '#888888',
  },
  username: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    marginTop: 2,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroContent: {
    marginBottom: 16,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  streakRow: {
    marginBottom: 8,
  },
  streakText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  tokenRow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff00ff22',
    borderColor: '#ff00ff',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiIcon: {
    fontSize: 18,
  },
  aiInfo: {
    flex: 1,
  },
  aiName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    maxWidth: '92%',
  },
  messageIcon: {
    fontSize: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    color: '#ffffff',
  },
  promptsContainer: {
    maxHeight: 60,
  },
  promptsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  promptText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  voiceIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#00ffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  profileSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  settingValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  actionArrow: {
    fontSize: 16,
    color: '#ff6b6b',
  },
});
