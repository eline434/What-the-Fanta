import { ActivityIndicator, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance, Place } from '@/lib/foursquare';
import { useLocationStore } from '@/stores/use-location-store';

type PlacePickerProps = {
  onPick: (place: Place) => void;
};

// The shops near you (loaded by the location store), to choose where you bought your Fanta.
export function PlacePicker({ onPick }: PlacePickerProps) {
  const theme = useTheme();
  const nearbyShops = useLocationStore((state) => state.nearbyShops);
  const status = useLocationStore((state) => state.status);
  const isLoadingShops = useLocationStore((state) => state.isLoadingShops);
  const shopsError = useLocationStore((state) => state.shopsError);

  if (status === 'locating' || isLoadingShops) {
    return (
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <ActivityIndicator />
        <ThemedText type="small">Looking for shops near you…</ThemedText>
      </View>
    );
  }
  if (status === 'denied') {
    return (
      <ThemedText type="small" themeColor="danger">
        Allow location access in your phone settings to add where you bought it.
      </ThemedText>
    );
  }
  if (status === 'error' || shopsError) {
    return (
      <ThemedText type="small" themeColor="danger">
        {shopsError ?? "Couldn't find your location. Is location turned on?"}
      </ThemedText>
    );
  }
  if (nearbyShops.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No shops found within 2 km.
      </ThemedText>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {nearbyShops.slice(0, 8).map((shop) => (
        <Pressable
          key={shop.id}
          onPress={() => onPick(shop)}
          style={({ pressed }) => ({
            padding: 12,
            borderRadius: 12,
            backgroundColor: theme.backgroundElement,
            opacity: pressed ? 0.7 : 1,
          })}>
          <ThemedText type="smallBold">{shop.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDistance(shop.distance)}
            {shop.address ? ` · ${shop.address}` : ''}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}
