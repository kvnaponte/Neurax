import { Vibration } from 'react-native'
import * as Haptics from 'expo-haptics'

/**
 * Medium haptic impact for drag activation. Falls back to a short vibration
 * if the native expo-haptics module isn't present in the current dev build.
 */
export function triggerHaptic() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch {
    Vibration.vibrate(80)
  }
}
