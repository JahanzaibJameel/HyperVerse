import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/stores/authStore';
import AuthService from '@/lib/services/AuthService';

export default function SetupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser, setLoading } = useAuthStore();

  const handleSetup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      setLoading(true);

      const authService = AuthService.getInstance();
      const profile = await authService.createInitialProfile(name.trim(), email.trim() || undefined);
      
      setUser(profile);
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to HyperVerse</Text>
        <Text style={styles.subtitle}>
          Your personal life operating system
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={50}
          />

          <TextInput
            style={styles.input}
            placeholder="Email (optional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSetup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Setting up...' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>
          All data is stored locally on your device
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#00ffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  footnote: {
    fontSize: 12,
    color: '#666',
    marginTop: 32,
    textAlign: 'center',
  },
});
