import { Redirect } from 'expo-router'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

export default function Index() {
  const onboardingDone = storage.getString('onboarding_completed')
  if (!onboardingDone) {
    return <Redirect href="/(auth)/onboarding" />
  }
  return <Redirect href="/(auth)/login" />
}
