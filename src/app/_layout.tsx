import { LilitaOne_400Regular, useFonts } from '@expo-google-fonts/lilita-one';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, DisplayFont } from '@/constants/theme';
import { useAuthStore } from '@/stores/use-auth-store';

SplashScreen.preventAutoHideAsync();

const colors = Colors.light;

// The What the Fanta look for every header and screen background of every Stack in the app.
// Headers use the "bold" font for their title, so that becomes Lilita One here.
const WhatTheFantaTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.backgroundElement,
    notification: colors.primary,
  },
  fonts: {
    ...DarkTheme.fonts,
    bold: { fontFamily: DisplayFont, fontWeight: 'normal' as const },
    heavy: { fontFamily: DisplayFont, fontWeight: 'normal' as const },
  },
};

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  // A hook, not a useEffect: it loads the font and re-renders when it's ready.
  const [fontsLoaded, fontError] = useFonts({ LilitaOne_400Regular });

  // Until the font is there we render nothing, so the splash screen stays visible
  // (no flash of the wrong font). If loading fails, we carry on with the system font.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={WhatTheFantaTheme}>
      <StatusBar style="light" />
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Not protected: guests can scan too, only saving a barcode needs an account. */}
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', headerShown: false }} />

        {/* Only reachable while logged out. As soon as you log in, the guard becomes
            false and Expo Router closes these screens by itself. */}
        <Stack.Protected guard={status !== 'signedIn'}>
          <Stack.Screen name="sign-in" options={{ presentation: 'modal', title: 'Log in' }} />
          <Stack.Screen name="sign-up" options={{ presentation: 'modal', title: 'Create account' }} />
        </Stack.Protected>

        {/* The opposite: only reachable while logged in. Log out while it's open and it closes. */}
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="check-in" options={{ presentation: 'modal', title: 'Log a Fanta' }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal', title: 'Edit profile' }} />
          <Stack.Screen name="add-fanta" options={{ presentation: 'modal', title: 'Add a new Fanta' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
