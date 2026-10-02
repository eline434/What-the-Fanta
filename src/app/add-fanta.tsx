import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { CanGraphic } from '@/components/fanta-can';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fanta } from '@/data/fantas';
import { useTheme } from '@/hooks/use-theme';
import { openFanta } from '@/lib/open-fanta';
import { cleanFantaName, useCatalogueStore } from '@/stores/use-catalogue-store';

export default function AddFantaScreen() {
  const theme = useTheme();
  // What you searched for in the grid comes along, so the name is already filled in.
  const { name: searchedName } = useLocalSearchParams<{ name?: string }>();
  const fantas = useCatalogueStore((state) => state.fantas);
  const addFanta = useCatalogueStore((state) => state.addFanta);

  // Local state: a draft of the new Fanta, only saved when you press the button.
  const [name, setName] = useState(searchedName ?? '');
  const [category, setCategory] = useState('other');
  const [zeroSugar, setZeroSugar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived: every kind that already exists in the catalogue (+ "other"), no separate list to keep up to date.
  const categories = [...new Set([...fantas.map((fanta) => fanta.category), 'other'])].sort();
  // Derived: is there already a Fanta with this name? Same cleaning rule as the store.
  const cleanName = cleanFantaName(name);
  const existing = fantas.find((fanta) => fanta.name.toLowerCase() === cleanName.toLowerCase());
  // Derived: a preview of the can, it changes while you type and pick.
  const preview: Fanta = {
    id: 'preview',
    name: cleanName || 'New Fanta',
    category,
    countries: [],
    status: 'limited',
    zero_sugar: zeroSugar,
    image_url: null,
    barcodes: [],
    created_at: null,
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // The store saves it and puts it straight in the catalogue, so the grid shows it right away.
      const fanta = await addFanta({ name, category, zero_sugar: zeroSugar });
      router.back();
      // Open the new Fanta, so you can ✓ it immediately.
      openFanta(fanta.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add this Fanta.');
      setIsSaving(false);
    }
  };

  const openExisting = () => {
    if (existing) {
      router.back();
      openFanta(existing.id);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Add a new Fanta' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <CanGraphic fanta={preview} scale={1.4} />
            <ThemedText type="subtitle">{preview.name}</ThemedText>
          </View>

          <TextField label="Name" value={name} onChangeText={setName} placeholder="Apple Sour" autoCapitalize="words" />

          {existing && (
            <View style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: theme.backgroundElement }}>
              <ThemedText type="small">{existing.name} already exists.</ThemedText>
              <Button label={`Open ${existing.name}`} variant="secondary" onPress={openExisting} />
            </View>
          )}

          <View style={{ gap: 8 }}>
            <ThemedText type="smallBold">Kind</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: option === category ? theme.primary : theme.backgroundElement,
                  }}>
                  <ThemedText type="small" style={{ color: option === category ? theme.onPrimary : theme.text }}>
                    {option}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ThemedText type="smallBold">Zero sugar</ThemedText>
            <Switch
              value={zeroSugar}
              onValueChange={setZeroSugar}
              trackColor={{ false: theme.backgroundElement, true: theme.primary }}
              thumbColor={theme.text}
            />
          </View>

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <Button
            label="Add Fanta"
            onPress={handleSave}
            loading={isSaving}
            disabled={cleanName.length < 2 || existing !== undefined}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
