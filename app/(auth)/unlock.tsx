import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/lib/stores/authStore';
import AuthService, { type LockedReason } from '@/lib/services/AuthService';

/**
 * Copy is chosen per failure mode so the user is never told to "try again" when
 * retrying cannot possibly help, and is never left without a way forward when a
 * retry will.
 */
function messageFor(reason: LockedReason): { title: string; detail: string } {
  switch (reason) {
    case 'cancelled':
      return {
        title: 'Unlock required',
        detail: 'Authenticate to open HyperVerse.',
      };
    case 'unavailable':
      return {
        title: 'Biometrics unavailable',
        detail:
          'This device has no enrolled biometric credential. Enrol one in your system settings, then try again.',
      };
    case 'failed':
    default:
      return {
        title: 'Authentication failed',
        detail: 'That did not match. Try again.',
      };
  }
}

export default function UnlockScreen() {
  const router = useRouter();
  const { user, hasAccount, markUnlocked } = useAuthStore();
  const [reason, setReason] = useState<LockedReason>('cancelled');
  const [detail, setDetail] = useState<string | undefined>(undefined);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const authenticate = useCallback(async () => {
    setIsAuthenticating(true);

    let result;
    try {
      result = await AuthService.getInstance().authenticateForApp();
    } catch (error) {
      // `authenticateForApp` is not expected to throw; if it ever does, treat it
      // as a failure rather than letting the exception reach the user as a
      // crash with no way back.
      setReason('failed');
      setDetail(error instanceof Error ? error.message : 'Authentication failed');
      setIsAuthenticating(false);
      return;
    }

    if (result.status === 'unlocked') {
      markUnlocked(user);
      router.replace('/(tabs)');
      return;
    }

    setReason(result.reason);
    setDetail(result.error);
    setIsAuthenticating(false);
  }, [markUnlocked, router, user]);

  useEffect(() => {
    authenticate();
    // Intentionally mount-only: this screen runs one unlock attempt on entry.
    // Further attempts are user-initiated via the retry button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No account means there is nothing to unlock yet — send the user to setup.
  useEffect(() => {
    if (!hasAccount && !isAuthenticating) {
      router.replace('/(auth)/setup');
    }
  }, [hasAccount, isAuthenticating, router]);

  const copy = messageFor(reason);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.detail}</Text>

      {detail ? <Text style={styles.detail}>{detail}</Text> : null}

      {isAuthenticating ? (
        <View style={styles.statusRow}>
          <ActivityIndicator color="#00d4ff" />
          <Text style={styles.status}>Authenticating…</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={authenticate} testID="unlock-retry-button">
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060b18',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 12,
  },
  detail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  status: {
    marginLeft: 10,
    fontSize: 14,
    color: '#94a3b8',
  },
  button: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#060b18',
  },
});
