import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowCard } from "@/components/GlowCard";
import { NeonButton } from "@/components/NeonButton";
import { useAuthStore } from "@/lib/stores/authStore";
import { useThemeStore, ACCENT_HEX, type AccentColor } from "@/lib/stores/themeStore";
import { SettingsRepository } from "@/lib/database/repositories/SettingsRepository";
import AuthService from "@/lib/services/AuthService";
import { useColors } from "@/hooks/useColors";

const BIOMETRIC_KEY = 'biometric_enabled';
const APP_LOCK_KEY = 'app_lock_enabled';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { themeMode, setThemeMode, accentColor, setAccentColor } = useThemeStore();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const loadSettings = useCallback(async () => {
    if (!user?.dbId) {
      setIsLoading(false);
      return;
    }
    try {
      const [bio, lock] = await Promise.all([
        SettingsRepository.getValue(user.dbId, BIOMETRIC_KEY, false),
        SettingsRepository.getValue(user.dbId, APP_LOCK_KEY, false),
      ]);
      setBiometricEnabled(!!bio);
      setAppLockEnabled(!!lock);
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.dbId]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const persistSetting = async (key: string, value: boolean) => {
    if (!user?.dbId) return;
    try {
      await SettingsRepository.setValue({
        userId: user.dbId,
        key,
        value,
        category: 'privacy',
      });
    } catch (error) {
      console.error(`Failed to save ${key}`, error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    const authService = AuthService.getInstance();
    if (value) {
      const success = await authService.enableBiometricAuth();
      if (!success) {
        Alert.alert('Unavailable', 'Biometric authentication could not be enabled on this device.');
        return;
      }
      setBiometricEnabled(true);
    } else {
      await authService.disableBiometricAuth();
      setBiometricEnabled(false);
    }
    await persistSetting(BIOMETRIC_KEY, value);
  };

  const handleAppLockToggle = async (value: boolean) => {
    const authService = AuthService.getInstance();
    if (value) {
      const success = await authService.enableAppLock();
      if (!success) {
        Alert.alert('Unavailable', 'App lock could not be enabled. Enable biometrics first.');
        return;
      }
      setAppLockEnabled(true);
    } else {
      await authService.disableAppLock();
      setAppLockEnabled(false);
    }
    await persistSetting(APP_LOCK_KEY, value);
  };

  const handleExport = async () => {
    if (!user?.dbId) return;
    
    try {
      setIsLoading(true);
      const authService = AuthService.getInstance();
      const exportedData = await authService.exportUserData();
      
      // Create a shareable file
      if (Platform.OS === 'web') {
        // For web, create a downloadable blob
        const blob = new Blob([exportedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hyperverse-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Export complete', 'Your data has been exported to a downloadable file.');
      } else {
        // For mobile, use the share API or save to device
        try {
          const FileSystem = await import('expo-file-system/legacy');
          const filename = `hyperverse-backup-${Date.now()}.json`;
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(fileUri, exportedData, {
            encoding: 'utf8',
          });

          const { shareAsync } = await import('expo-sharing');
          await shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export HyperVerse Data',
            UTI: 'public.json',
          });
          Alert.alert('Export complete', 'Your data has been shared successfully!');
        } catch {
          // If sharing fails, show an alert with the data
          Alert.alert('Export complete', 'Your data has been generated. Check your sharing options.', [
            { text: 'OK' },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to export data', error);
      Alert.alert('Error', 'Failed to export your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Delete all data?',
      'This permanently removes your profile and every task, habit, health, finance, and AI record from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Wiping every record is destructive and irreversible, so it is
              // gated behind the same system check the app lock uses — even when
              // the user has not enabled app lock.
              const unlock = await AuthService.getInstance().authenticateForApp();
              if (unlock.status !== 'unlocked') {
                Alert.alert(
                  'Authentication required',
                  unlock.reason === 'unavailable'
                    ? 'Set up a screen lock or biometric on this device to confirm.'
                    : 'Confirm your identity to delete everything.',
                );
                return;
              }

              await AuthService.getInstance().deleteProfile(user?.dbId);
              logout();
              router.replace('/(auth)/setup');
            } catch (error) {
              console.error('Failed to delete account data', error);
              Alert.alert('Error', 'Failed to delete your data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const ACCENTS: { name: AccentColor; color: string }[] = [
    { name: 'cyan', color: ACCENT_HEX.cyan },
    { name: 'purple', color: ACCENT_HEX.purple },
    { name: 'pink', color: ACCENT_HEX.pink },
    { name: 'green', color: ACCENT_HEX.green },
    { name: 'orange', color: ACCENT_HEX.orange },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === "web" ? 120 : 100,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>SETTINGS</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Configure your HyperVerse preferences
      </Text>

      {/* Appearance */}
      <GlowCard glowColor={colors.cyan} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="palette-outline" size={16} color={colors.cyan} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>APPEARANCE</Text>
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Theme</Text>
        <View style={styles.row}>
          {(["dark", "light"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeMode(mode);
              }}
              accessibilityLabel={`Use ${mode} theme`}
              accessibilityRole="button"
              style={[
                styles.optionPill,
                {
                  backgroundColor: themeMode === mode ? colors.cyan + "22" : colors.secondary,
                  borderColor: themeMode === mode ? colors.cyan : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: themeMode === mode ? colors.cyan : colors.mutedForeground },
                ]}
              >
                {mode === "dark" ? "Dark" : "Light"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>Accent colour</Text>
        <View style={styles.accentRow}>
          {ACCENTS.map((a) => (
            <TouchableOpacity
              key={a.name}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAccentColor(a.name);
              }}
              accessibilityLabel={`Use ${a.name} accent`}
              accessibilityRole="button"
              style={[
                styles.accentSwatch,
                {
                  backgroundColor: a.color,
                  borderColor: accentColor === a.name ? colors.foreground : 'transparent',
                },
              ]}
            />
          ))}
        </View>
      </GlowCard>

      {/* Security */}
      <GlowCard glowColor={colors.green} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.green} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>SECURITY</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Biometric unlock</Text>
            <Text style={[styles.settingHint, { color: colors.mutedForeground }]}>
              Use Face ID / fingerprint to unlock
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={isLoading}
            trackColor={{ false: colors.border, true: colors.green + "66" }}
            thumbColor={biometricEnabled ? colors.green : colors.mutedForeground}
            accessibilityLabel="Toggle biometric unlock"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>App lock</Text>
            <Text style={[styles.settingHint, { color: colors.mutedForeground }]}>
              Require authentication on launch
            </Text>
          </View>
          <Switch
            value={appLockEnabled}
            onValueChange={handleAppLockToggle}
            disabled={isLoading}
            trackColor={{ false: colors.border, true: colors.green + "66" }}
            thumbColor={appLockEnabled ? colors.green : colors.mutedForeground}
            accessibilityLabel="Toggle app lock"
          />
        </View>
      </GlowCard>

      {/* Data */}
      <GlowCard glowColor={colors.purple} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="database-outline" size={16} color={colors.purple} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>DATA</Text>
        </View>
        <NeonButton label="Export my data" onPress={handleExport} size="md" color={colors.purple} />
        <View style={{ height: 8 }} />
        <NeonButton label="Delete all data and log out" onPress={handleLogout} size="md" color={colors.pink} />
      </GlowCard>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>HyperVerse v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  screenSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 16 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: "row", gap: 8 },
  optionPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  optionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  accentRow: { flexDirection: "row", gap: 12 },
  accentSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  settingHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: 1, marginVertical: 16 },
  version: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8 },
});