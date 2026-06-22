import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'

// Mantener el splash visible hasta que las fuentes Cinzel estén cargadas
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'CinzelDecorative-Regular': require('../assets/fonts/CinzelDecorative-Regular.ttf'),
    'CinzelDecorative-Bold': require('../assets/fonts/CinzelDecorative-Bold.ttf'),
    'CinzelDecorative-Black': require('../assets/fonts/CinzelDecorative-Black.ttf'),
    'Cinzel-Regular': require('../assets/fonts/Cinzel-Regular.ttf'),
    'Cinzel-Medium': require('../assets/fonts/Cinzel-Medium.ttf'),
    'Cinzel-SemiBold': require('../assets/fonts/Cinzel-SemiBold.ttf'),
    'Cinzel-Bold': require('../assets/fonts/Cinzel-Bold.ttf'),
    'Cinzel-ExtraBold': require('../assets/fonts/Cinzel-ExtraBold.ttf'),
    'Cinzel-Black': require('../assets/fonts/Cinzel-Black.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  // Evita renderizar texto con fuente fallback antes de cargar Cinzel
  if (!fontsLoaded && !fontError) return null

  return (
    <>
      <StatusBar style="light" backgroundColor="#07061a" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#07061a' } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}
