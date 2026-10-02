/**
 * The "What the Fanta" look: a light lavender purple with lighter lavender cards.
 * The app always uses it (app.json: userInterfaceStyle "dark"), so light and dark share
 * the same colours. Every screen reads its colours from here: change a value and the whole app follows.
 */

import '@/global.css';

import { Platform } from 'react-native';

const WhatTheFanta = {
  text: '#FFFFFF',
  textSecondary: '#F3ECFF', // very light lilac
  background: '#784cc5', // lavender purple: every screen, header and the tab bar
  backgroundElement: '#A580E4', // lighter lavender: cards, tiles, search bar
  backgroundSelected: '#B999EC', // lines, bell circles, the ? shapes behind the logo
  brand: '#1D3F9B', // Fanta logo blue
  heading: '#FFFFFF', // white: section titles (yellow is hard to read on light purple)
  primary: '#FF8200', // Fanta orange: main buttons, the selected tab
  onPrimary: '#2A0A4A', // dark text/icons on orange: white on orange is hard to read
  ink: '#2A0A4A', // dark purple for text on bright colours (orange buttons, the yellow avatar circle)
  accent: '#5B2A9E', // darker purple: "yours" (your review, ✓ when you drank it) stands out
  highlight: '#FF8200', // yellow: stars and your avatar circle (they get a dark edge to stand out)
  danger: '#FFE0E0', // very light red, readable on purple
} as const;

export const Colors = {
  light: WhatTheFanta,
  dark: WhatTheFanta,
} as const;

// The chunky Fanta-style font, loaded in the root layout with useFonts().
export const DisplayFont = 'LilitaOne_400Regular';

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
