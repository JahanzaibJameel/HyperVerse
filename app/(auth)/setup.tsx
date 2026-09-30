import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/lib/stores/authStore';
import AuthService from '@/lib/services/AuthService';
import { useDatabase } from '@/lib/database/useDatabase';
import { UserRepository } from '@/lib/database/repositories/UserRepository';

export default function SetupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser, setLoading } = useAuthStore();
  const { database: db, isReady } = useDatabase();

  const handleSetup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!isReady || !db) {
      Alert.alert('Error', 'Database is not ready. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      setLoading(true);

      const authService = AuthService.getInstance();
      const profile = await authService.createInitialProfile(name.trim(), email.trim() || undefined);

      // Persist the matching users row in SQLite so domain data can be scoped to it.
      const user = await UserRepository.upsertFromProfile({
        deviceId: profile.deviceId,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        level: profile.level,
        xp: profile.xp,
        xpToNextLevel: profile.xpToNextLevel,
        streak: profile.streak,
        tokens: profile.tokens,
        nfts: profile.nfts,
        isActive: profile.isActive,
      });

      setUser({ ...profile, dbId: user.id });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Setup failed:', error);
      Alert.alert('Setup Failed', 'Unable to create your profile. Please try again.');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      <Text style={styles.title}>Welcome to HyperVerse</Text>
      <Text style={styles.subtitle}>Set up your profile to get started</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email (optional)"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
         keyboardType="email-address"
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSetup}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Setting up...' : 'Get Started'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060b18',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#0f1a30',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#f1f5f9',
  },
  button: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#060b18',
  },
});