import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { LOGO_ASPECT_RATIO, WhatTheFantaLogo } from '@/constants/logo';
import { Colors } from '@/constants/theme';

const DURATION = 900;

// Shown over the app while it starts: the What the Fanta logo, then it pops and fades away.
export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const fadeOut = new Keyframe({
    0: { opacity: 1, transform: [{ scale: 1 }] },
    40: { opacity: 1, transform: [{ scale: 1.08 }], easing: Easing.out(Easing.quad) },
    100: { opacity: 0, transform: [{ scale: 1.25 }], easing: Easing.in(Easing.quad) },
  });

  return animate ? (
    <Animated.View
      entering={fadeOut.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      <Image source={WhatTheFantaLogo} style={{ width: 240, aspectRatio: LOGO_ASPECT_RATIO }} contentFit="contain" accessibilityLabel="What the Fanta" />
    </Animated.View>
  ) : (
    <View
      // Once this overlay is drawn, the native splash screen can go: it looks the same.
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      <Image source={WhatTheFantaLogo} style={{ width: 240, aspectRatio: LOGO_ASPECT_RATIO }} contentFit="contain" accessibilityLabel="What the Fanta" />
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
