import { Link, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Icon } from '@/components/ui/Icon';
import { NavigationThemes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NavigationThemes[scheme]}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: 'Autolearn',
              headerRight: () => (
                <Link href="/settings" accessibilityLabel="Open settings">
                  <Icon name="settings" size={22} color="textSecondary" />
                </Link>
              ),
            }}
          />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
