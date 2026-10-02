import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getCanColors } from '@/constants/fanta-colors';
import { Fanta } from '@/data/fantas';
import { useTheme } from '@/hooks/use-theme';

type FantaCanProps = {
  fanta: Fanta;
  isTried?: boolean; // not tried yet: the can is faded, like in the sketch
};

// One tile in the grid: the can + its name.
export function FantaCan({ fanta, isTried = true }: FantaCanProps) {
  const theme = useTheme();

  return (
    <View style={[styles.tile, { backgroundColor: theme.backgroundElement }]}>
      {/* Only the can fades, the name stays easy to read. */}
      <View style={{ opacity: isTried ? 1 : 0.35 }}>
        <CanGraphic fanta={fanta} />
      </View>
      {/* Always 2 lines high, so every tile in the grid has the same height (FlashList needs that). */}
      <ThemedText type="small" numberOfLines={2} style={styles.name}>
        {fanta.name}
      </ThemedText>
    </View>
  );
}

type CanGraphicProps = {
  fanta: Fanta;
  scale?: number; // 1 = grid size, bigger for the detail screen
};

// The real photo once a Fanta has an image_url, otherwise a can drawn with plain Views.
export function CanGraphic({ fanta, scale = 1 }: CanGraphicProps) {
  const colors = getCanColors(fanta);
  const size = { width: 52 * scale, height: 92 * scale };

  if (fanta.image_url) {
    return <Image source={fanta.image_url} style={size} contentFit="contain" />;
  }

  return (
    <View style={[styles.can, size, { borderRadius: 10 * scale, backgroundColor: colors.body }]}>
      <View style={[styles.rim, { height: 7 * scale }]} />
      <View style={[styles.shine, { left: 8 * scale, width: 6 * scale }]} />
      <View style={[styles.label, { paddingHorizontal: 5 * scale, paddingVertical: 3 * scale }]}>
        <Text style={[styles.labelText, { fontSize: 10 * scale }]}>FANTA</Text>
      </View>
      {fanta.zero_sugar && (
        <View style={[styles.zeroBand, { bottom: 16 * scale }]}>
          <Text style={[styles.zeroText, { fontSize: 8 * scale }]}>ZERO</Text>
        </View>
      )}
      <View style={[styles.bottom, { height: 10 * scale, backgroundColor: colors.dark }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    margin: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  can: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#C9CCD1',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  label: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    transform: [{ rotate: '-8deg' }],
  },
  labelText: {
    color: '#1D3F9B',
    fontWeight: 900,
    fontStyle: 'italic',
  },
  zeroBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  zeroText: {
    color: '#ffffff',
    fontWeight: 800,
    letterSpacing: 1,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  name: {
    textAlign: 'center',
    height: 40,
  },
});
