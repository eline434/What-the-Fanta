import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddFantaTile } from '@/components/add-fanta-tile';
import { FantaCan } from '@/components/fanta-can';
import { FantaLink } from '@/components/fanta-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FantaSprite, SPRITE_ASPECT_RATIO } from '@/constants/logo';
import { BottomTabInset } from '@/constants/theme';
import { Fanta } from '@/data/fantas';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCatalogueStore } from '@/stores/use-catalogue-store';
import { useCheckInStore } from '@/stores/use-check-in-store';

// "berry" finds Strawberry (category), "japan" finds the Japanese ones (country).
const matchesSearch = (fanta: Fanta, search: string) =>
  fanta.name.toLowerCase().includes(search) ||
  fanta.category.toLowerCase().includes(search) ||
  fanta.countries.some((country) => country.toLowerCase().includes(search));

export default function FantasScreen() {
  const fantas = useCatalogueStore((state) => state.fantas);
  const status = useCatalogueStore((state) => state.status);
  const loadCatalogue = useCatalogueStore((state) => state.loadCatalogue);
  const theme = useTheme();
  const myCheckIns = useCheckInStore((state) => state.myCheckIns);
  const isSignedIn = useAuthStore((state) => state.status === 'signedIn');
  const insets = useSafeAreaInsets();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Local state: only this screen cares about what you typed.
  const [query, setQuery] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);

  // Same pattern as the photo: ask for the camera when you want to use it.
  const openScanner = async () => {
    const isGranted = cameraPermission?.granted || (await requestCameraPermission()).granted;
    if (!isGranted) {
      setScanError('Allow camera access in your phone settings to scan barcodes.');
      return;
    }
    setScanError(null);
    router.push('/scan');
  };

  // Derived data: calculated on every render, never stored.
  const search = query.trim().toLowerCase();
  const results = search === '' ? fantas : fantas.filter((fanta) => matchesSearch(fanta, search));
  // The ids of every Fanta you logged. A Set makes "is this one in there?" quick to check.
  const triedIds = new Set(myCheckIns.map((checkIn) => checkIn.flavour_id));
  // The grid shows the results + one extra tile at the end: "add a new fanta" (from the sketch).
  const gridItems: (Fanta | 'add')[] = [...results, 'add'];

  // Protected in the event handler, like the ✓ button: log in first.
  const openAddFanta = () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    // Your search text comes along, so the name is already filled in.
    router.push({ pathname: '/add-fanta', params: { name: query.trim() } });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          // The small logo instead of a text title, with a line under the header like the sketch.
          headerTitle: () => <Image source={FantaSprite} style={{ height: 34, aspectRatio: SPRITE_ASPECT_RATIO }} contentFit="contain" accessibilityLabel="Fanta" />,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
        }}
      />
      <View style={{ height: 2, marginHorizontal: 16, backgroundColor: theme.backgroundSelected }} />

      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <SearchBar value={query} onChangeText={setQuery} />
          </View>
          <ScanButton onPress={openScanner} />
        </View>
        {scanError && (
          <ThemedText type="small" themeColor="danger">
            {scanError}
          </ThemedText>
        )}
        {status === 'offline' && (
          <ThemedView type="backgroundElement" style={{ padding: 12, borderRadius: 12 }}>
            <ThemedText type="small">
              You&apos;re offline: showing the {fantas.length} classic Fantas. Pull down to try again.
            </ThemedText>
          </ThemedView>
        )}
        <ThemedText type="small" themeColor="textSecondary">
          {results.length === 0
            ? `No Fanta found for "${query.trim()}". Add it below!`
            : `${results.length} ${results.length === 1 ? 'Fanta' : 'Fantas'}`}
        </ThemedText>
      </View>

      <FlashList
        data={gridItems}
        numColumns={3}
        keyExtractor={(item) => (item === 'add' ? 'add' : item.id)}
        // Two kinds of tiles: FlashList reuses tiles better when it knows which kind each one is.
        getItemType={(item) => (item === 'add' ? 'add' : 'fanta')}
        // The list of Fantas doesn't change when you log one, only whether it's faded.
        // extraData tells FlashList to redraw the tiles when your check-ins change.
        extraData={myCheckIns}
        renderItem={({ item }) =>
          item === 'add' ? (
            <AddFantaTile onPress={openAddFanta} />
          ) : (
            <FantaLink fantaId={item.id}>
              {/* Logged out, nothing is faded: we don't know what you tried. */}
              <FantaCan fanta={item} isTried={!isSignedIn || triedIds.has(item.id)} />
            </FantaLink>
          )
        }
        // Pulling down is an event, so it calls the store action directly.
        refreshing={status === 'loading'}
        onRefresh={loadCatalogue}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: insets.bottom + BottomTabInset }}
      />
    </ThemedView>
  );
}

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
};

const SearchBar = ({ value, onChangeText }: SearchBarProps) => {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.backgroundElement,
        borderRadius: 12,
        paddingHorizontal: 12,
      }}>
      <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={theme.textSecondary} size={20} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search flavour, category or country"
        placeholderTextColor={theme.textSecondary}
        autoCorrect={false}
        style={{ flex: 1, color: theme.text, fontSize: 16, paddingVertical: 12 }}
      />
      {value !== '' && (
        <Pressable onPress={() => onChangeText('')} hitSlop={12}>
          <SymbolView name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }} tintColor={theme.textSecondary} size={20} />
        </Pressable>
      )}
    </View>
  );
};

const ScanButton = ({ onPress }: { onPress: () => void }) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Scan a barcode"
      style={({ pressed }) => ({
        width: 48,
        borderRadius: 12,
        backgroundColor: theme.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}>
      <SymbolView name={{ ios: 'barcode.viewfinder', android: 'barcode_scanner', web: 'barcode_scanner' }} tintColor={theme.text} size={24} />
    </Pressable>
  );
};
