import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';

import { useAuthStore } from '@/lib/stores/authStore';

export default function AuthLayout() {
  const { user, isLoading } = useAuthStore();

  // If user is already authenticated, redirect to main app
  if (user && !isLoading) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="setup" options={{ headerShown: false }} />
    </Stack>
  );
}
