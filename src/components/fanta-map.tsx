import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';

import { Button } from '@/components/button';
import { ShopMap, type MapRegion, type ShopMapHandle } from '@/components/shop-map';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { distanceBetween, formatDistance, Place, searchShops } from '@/lib/foursquare';
import { useLocationStore } from '@/stores/use-location-store';

// Zoomed out further than this (about a city), we don't ask Foursquare: it returns at most
// 50 shops, which would be a random handful spread over the whole country. It also saves free calls.
const MIN_SEARCH_ZOOM = 12;
const MAX_RADIUS = 10_000;

// The "locations with fanta" map from the sketch, on Home: shops that sell Fanta + a card for the one you tap.
export function FantaMap() {
  const theme = useTheme();
  const mapRef = useRef<ShopMapHandle>(null);
  // Counts the searches, so an old slow answer can't replace a newer one.
  const latestSearch = useRef(0);

  const position = useLocationStore((state) => state.position);
  const locationStatus = useLocationStore((state) => state.status);
  const locateMe = useLocationStore((state) => state.locateMe);

  // Local state: only this map needs the shops of the area you're looking at.
  const [shops, setShops] = useState<Place[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isZoomedOut, setIsZoomedOut] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  // Derived: the shop whose card is open.
  const selectedShop = shops.find((shop) => shop.id === selectedId) ?? null;

  // Event from the map: it's loaded. Now (and only now) ask for your location.
  const handleReady = async () => {
    const found = await locateMe();
    if (found) {
      mapRef.current?.showMe(found);
    }
  };

  // Event from the map: it stopped moving. Load the shops in view.
  const handleMoved = async (region: MapRegion) => {
    const tooFar = region.zoom < MIN_SEARCH_ZOOM;
    setIsZoomedOut(tooFar);
    if (tooFar) {
      return;
    }

    const search = ++latestSearch.current;
    setIsLoading(true);
    try {
      const found = await searchShops(region, Math.min(region.radius, MAX_RADIUS));
      if (search !== latestSearch.current) {
        return;
      }
      setShops(found);
      setError(null);
      mapRef.current?.showShops(found);
      // Keep the selected pin highlighted if that shop is still in view.
      if (selectedId && found.some((shop) => shop.id === selectedId)) {
        mapRef.current?.selectShop(selectedId);
      }
    } catch {
      if (search === latestSearch.current) {
        setError("Couldn't load shops. Move the map to try again.");
      }
    } finally {
      if (search === latestSearch.current) {
        setIsLoading(false);
      }
    }
  };

  // Event from the map: you tapped a pin (id) or the map itself (null).
  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    mapRef.current?.selectShop(id);
  };

  // A native feature: hand the address to the phone's own maps app for directions.
  const openDirections = (shop: Place) => {
    Linking.openURL(`geo:0,0?q=${shop.latitude},${shop.longitude}(${encodeURIComponent(shop.name)})`);
  };

  const statusText = isLoading
    ? 'Looking for shops…'
    : error ??
      (locationStatus === 'denied'
        ? 'No location access: zoom in on your town to see the shops there.'
        : isZoomedOut
          ? 'Zoom in to see shops that sell Fanta.'
          : `${shops.length} ${shops.length === 1 ? 'shop' : 'shops'} that sell Fanta`);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ height: 320, borderRadius: 20, overflow: 'hidden', backgroundColor: theme.backgroundElement }}>
        {mapFailed ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <ThemedText style={{ textAlign: 'center' }}>The map needs an internet connection.</ThemedText>
          </View>
        ) : (
          <ShopMap
            ref={mapRef}
            onReady={handleReady}
            onMoved={handleMoved}
            onSelect={handleSelect}
            onFailed={() => setMapFailed(true)}
          />
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {isLoading && <ActivityIndicator size="small" color={theme.text} />}
        <ThemedText type="small" themeColor={error ? 'danger' : 'textSecondary'}>
          {statusText}
        </ThemedText>
      </View>

      {/* The place card, when a pin is selected */}
      {selectedShop && (
        <View style={{ padding: 16, gap: 10, borderRadius: 20, backgroundColor: theme.backgroundElement }}>
          <ThemedText type="subtitle">{selectedShop.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {[
              selectedShop.category,
              selectedShop.address,
              position ? `${formatDistance(distanceBetween(position, selectedShop))} from you` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </ThemedText>
          <Button label="Directions" onPress={() => openDirections(selectedShop)} />
        </View>
      )}
    </View>
  );
}
