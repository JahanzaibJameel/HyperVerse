import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/context/AppContext';
import { useAuthStore } from '@/lib/stores/authStore';
import AuthService from '@/lib/services/AuthService';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const initializeApp = async () => {
      try {
        setLoading(true);

        const profile = await AuthService.getInstance().loadUserProfile();

        if (!cancelled && profile) {
          setUser(profile);
        }
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        if (!cancelled) {
          // The splash screen is released even when the profile read failed, so a
          // SecureStore or SQLite error lands the user on the login screen
          // instead of a permanently blank screen.
          setIsInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading]);

  if (!isInitialized) {
    return null; // Show splash screen
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AppProvider>
              <RootLayoutNav />
            </AppProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
