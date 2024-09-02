import { Stack } from 'expo-router'
import { Head } from 'expo-router/build/head/ExpoHead.android'
import { Provider, useGlobalState } from '../state/AppContext'
import { StatusBar } from 'react-native'

export default function RootLayout() {
  return (
    <Provider>
      {/*<StatusBar*/}
      {/*  backgroundColor={'black'}*/}
      {/*  // backgroundColor={state.theme.primary}*/}
      {/*  // barStyle="light-content"*/}
      {/*/>*/}
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
