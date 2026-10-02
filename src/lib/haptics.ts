import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// On Android the docs recommend performAndroidHapticsAsync: it uses the phone's own
// haptics engine (feels better than a plain vibration). iOS uses the standard feedback.

export const buzzSuccess = () =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

export const buzzWarning = () =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
