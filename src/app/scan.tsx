import { BarcodeScanningResult, CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CanGraphic } from '@/components/fanta-can';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fanta } from '@/data/fantas';
import { useTheme } from '@/hooks/use-theme';
import { buzzSuccess, buzzWarning } from '@/lib/haptics';
import { lookUpProduct, Product } from '@/lib/open-food-facts';
import { openFanta } from '@/lib/open-fanta';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCatalogueStore } from '@/stores/use-catalogue-store';

// Words that appear in almost every product name, so they don't help to find the flavour.
const IGNORED_WORDS = ['fanta', 'zero', 'sugar', 'free', 'can', 'bottle', 'the', 'and'];

// "fanta Mango Dragonfruit 0,33" → the Fantas whose name contains "mango" or "dragonfruit",
// best match first. Zero sugar products prefer zero sugar Fantas.
const suggestFantas = (fantas: Fanta[], productName: string) => {
  const name = productName.toLowerCase();
  const words = name.split(/[^a-z]+/).filter((word) => word.length > 2 && !IGNORED_WORDS.includes(word));
  const isZero = name.includes('zero');

  return fantas
    .map((fanta) => {
      const matches = words.filter((word) => fanta.name.toLowerCase().includes(word)).length;
      return { fanta, score: matches === 0 ? 0 : matches + (fanta.zero_sugar === isZero ? 0.5 : 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ fanta }) => fanta);
};

export default function ScanScreen() {
  const fantas = useCatalogueStore((state) => state.fantas);
  const addBarcode = useCatalogueStore((state) => state.addBarcode);
  const isSignedIn = useAuthStore((state) => state.status === 'signedIn');
  const insets = useSafeAreaInsets();

  // Local state: only this screen needs any of it.
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleScanned = async ({ data }: BarcodeScanningResult) => {
    // Setting this makes onBarcodeScanned undefined (see CameraView below), so the
    // camera stops reporting the same barcode 30 times per second.
    setScannedCode(data);
    buzzSuccess();

    const knownFanta = fantas.find((fanta) => fanta.barcodes.includes(data));
    if (knownFanta) {
      router.back();
      openFanta(knownFanta.id);
      return;
    }

    setIsLookingUp(true);
    const foundProduct = await lookUpProduct(data);
    setProduct(foundProduct);
    setIsLookingUp(false);
    if (foundProduct && !foundProduct.isFanta) {
      buzzWarning();
    }
  };

  const handlePick = async (fanta: Fanta) => {
    // Logged in: save the barcode, so the next scan (by anyone) opens this Fanta directly.
    if (isSignedIn && scannedCode) {
      try {
        await addBarcode(fanta.id, scannedCode);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save the barcode.');
        return;
      }
    }
    router.back();
    openFanta(fanta.id);
  };

  const scanAgain = () => {
    setScannedCode(null);
    setProduct(null);
    setQuery('');
    setError(null);
  };

  // Derived: what you typed wins, otherwise the suggestions based on the product name.
  const search = query.trim().toLowerCase();
  const options = search !== ''
    ? fantas.filter((fanta) => fanta.name.toLowerCase().includes(search)).slice(0, 5)
    : suggestFantas(fantas, product?.name ?? '');

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={scannedCode ? undefined : handleScanned}
      />

      {/* Aiming frame + hint */}
      {!scannedCode && (
        <View style={styles.aim} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.hint}>Point at the barcode on your Fanta</Text>
        </View>
      )}

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityLabel="Close scanner"
        style={[styles.close, { top: insets.top + 12 }]}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      {scannedCode && (
        <KeyboardAvoidingView behavior="padding" style={styles.sheetWrapper} pointerEvents="box-none">
          <ThemedView style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            {isLookingUp ? (
              <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
                <ActivityIndicator />
                <ThemedText type="small">Looking up {scannedCode}…</ThemedText>
              </View>
            ) : product && !product.isFanta ? (
              <View style={{ gap: 12 }}>
                <ThemedText type="subtitle">Not a Fanta 🤔</ThemedText>
                <ThemedText themeColor="textSecondary">
                  This looks like “{product.name || product.brands}”. Try the barcode on a Fanta can or bottle.
                </ThemedText>
                <Button label="Scan again" onPress={scanAgain} />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
                <ThemedText type="subtitle">New can! Which Fanta is this?</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {product
                    ? `Open Food Facts calls it “${product.name}”.`
                    : `Nobody has scanned barcode ${scannedCode} yet.`}
                </ThemedText>

                <TextField label="Search" value={query} onChangeText={setQuery} placeholder="Type a flavour" />

                {options.map((fanta) => (
                  <FantaOption key={fanta.id} fanta={fanta} onPress={() => handlePick(fanta)} />
                ))}
                {options.length === 0 && (
                  <ThemedText type="small" themeColor="textSecondary">
                    No match found. Try searching for the flavour.
                  </ThemedText>
                )}

                {!isSignedIn && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Log in to save this barcode for everyone.
                  </ThemedText>
                )}
                {error && (
                  <ThemedText type="small" themeColor="danger">
                    {error}
                  </ThemedText>
                )}

                <Button label="Scan again" variant="secondary" onPress={scanAgain} />
              </ScrollView>
            )}
          </ThemedView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

type FantaOptionProps = {
  fanta: Fanta;
  onPress: () => void;
};

const FantaOption = ({ fanta, onPress }: FantaOptionProps) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 8,
        borderRadius: 12,
        backgroundColor: theme.backgroundElement,
        opacity: pressed ? 0.7 : 1,
      })}>
      <CanGraphic fanta={fanta} scale={0.45} />
      <ThemedText style={{ flex: 1 }}>{fanta.name}</ThemedText>
      <ThemedText themeColor="textSecondary">›</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  aim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  frame: {
    width: 260,
    height: 150,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  hint: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
  },
  close: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 22,
  },
  sheetWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
});
