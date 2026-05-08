import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>
        Settings
      </Text>
      <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
        Configure your HyperVerse preferences
      </Text>
    </SafeAreaView>
  );
}
