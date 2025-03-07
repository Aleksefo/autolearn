import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
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
    </>
  )
}
