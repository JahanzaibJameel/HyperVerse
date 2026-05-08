import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HabitsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>
        Habits
      </Text>
      <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
        Track your daily habits and build streaks
      </Text>
    </SafeAreaView>
  );
}
