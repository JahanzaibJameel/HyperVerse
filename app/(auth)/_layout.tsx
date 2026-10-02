import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';

import { useAuthStore } from '@/lib/stores/authStore';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Only an *unlocked* session may enter the app. Gating on `user` alone would
  // let a hydrated profile bypass the lock screen.
  if (isAuthenticated && !isLoading) {
    return <Redirect href="/(tabs)" />;
  }

  // A returning user who has an account but has not unlocked goes to the unlock
  // screen; a first-run user goes to setup.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="setup" options={{ headerShown: false }} />
      <Stack.Screen name="unlock" options={{ headerShown: false }} />
    </Stack>
  );
}
