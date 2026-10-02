// We import the parts of expo-notifications we need one by one, NOT the whole package.
// Importing 'expo-notifications' itself also loads its push-token code, which throws an
// error in Expo Go on Android (push is not allowed there), even if you never use push.
import { addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';

import { NewsItem } from '@/types/database';

// All the Expo Notifications code in one place.
// We only use LOCAL notifications: the app shows them itself. Push notifications
// (sent by a server while the app is closed) don't work in Expo Go on Android.

export { addNotificationResponseReceivedListener };

// Show the notification even when the app is open (by default it would be hidden then).
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Every call is wrapped in try/catch: some parts of expo-notifications are missing in Expo Go
// (for example Android notification channels). A missing feature should never crash the app.

export const hasNotificationPermission = async () => {
  try {
    return (await getPermissionsAsync()).granted;
  } catch {
    return false;
  }
};

// Called once when the app starts. Shows Android's popup only if you haven't answered yet.
// (No own notification channel: Expo Go can't create one, it uses its own default channel.)
export const askNotificationPermission = async () => {
  try {
    if (await hasNotificationPermission()) {
      return true;
    }
    return (await requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
};

// Shows a native notification right now. Does nothing when notifications are off.
export const showNewsNotification = async (item: NewsItem, extraCount = 0) => {
  if (!(await hasNotificationPermission())) {
    return;
  }
  try {
    await scheduleNotificationAsync({
      content: {
        title: 'Fanta 🍊',
        body: extraCount > 0 ? `${item.message} (+${extraCount} more)` : item.message,
      },
      trigger: null, // null = show it right now
    });
  } catch (e) {
    console.warn('Could not show the notification:', e);
  }
};
