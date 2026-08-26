import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          // Explicit light header until Phase 4 theming.
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#111',
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Autolearn',
            headerRight: () => (
              <Link href="/settings" accessibilityLabel="Open settings">
                <Ionicons name="settings-outline" size={22} color="#333" />
              </Link>
            ),
          }}
        />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
