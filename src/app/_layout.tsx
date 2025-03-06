import { Stack } from 'expo-router'
import { Provider } from '../state/AppContext'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <Provider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Autolearn',
            // Hide the header for this route
            // headerShown: false,
          }}
        />
      </Stack>
    </Provider>
  )
}
