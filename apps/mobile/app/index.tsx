import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Redirect } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

export default function Index() {
  const [ready, setReady] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_completed').then((val) => {
      setOnboardingDone(val === 'true')
      setReady(true)
    })
  }, [])

  // Blank dark screen while reading from SecureStore
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#07061a' }} />
  if (!onboardingDone) return <Redirect href="/(auth)/onboarding" />
  return <Redirect href="/(auth)/login" />
}
