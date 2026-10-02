import { useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { CanGraphic } from '@/components/fanta-can';
import { PhotoCamera } from '@/components/photo-camera';
import { PlacePicker } from '@/components/place-picker';
import { StarRating } from '@/components/star-rating';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Place } from '@/lib/foursquare';
import { useCatalogueStore } from '@/stores/use-catalogue-store';
import { useCheckInStore } from '@/stores/use-check-in-store';
import { useLocationStore } from '@/stores/use-location-store';

// "I drank this": rate a Fanta and optionally add a photo and the shop where you bought it.
export default function CheckInScreen() {
  const { fantaId } = useLocalSearchParams<{ fantaId: string }>();
  const fanta = useCatalogueStore((state) => state.fantas.find((fanta) => fanta.id === fantaId));
  const addCheckIn = useCheckInStore((state) => state.addCheckIn);
  const findShopsNearMe = useLocationStore((state) => state.findShopsNearMe);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Local state: a draft that only this screen needs until you press Save.
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [isPickingPlace, setIsPickingPlace] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Ask for camera access at the moment you want to use it, not when the screen opens.
  const openCamera = async () => {
    const isGranted = cameraPermission?.granted || (await requestCameraPermission()).granted;
    if (!isGranted) {
      setError('Allow camera access in your phone settings to add a photo.');
      return;
    }
    setError(null);
    setIsCameraOpen(true);
  };

  // When you tap the comment field: wait until the keyboard is fully open, then scroll
  // down so the field is visible. A one-time listener inside the event handler, no useEffect.
  const scrollToComment = () => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollToEnd({ animated: true });
      subscription.remove();
    });
  };

  // The button press starts it all: permission, GPS position and the Foursquare shops.
  const startPickingPlace = () => {
    setIsPickingPlace(true);
    findShopsNearMe();
  };

  const handlePlacePicked = (pickedPlace: Place) => {
    setPlace(pickedPlace);
    setIsPickingPlace(false);
  };

  const handlePhotoTaken = (uri: string) => {
    setPhotoUri(uri);
    setIsCameraOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // The store uploads the photo first, then puts the new check-in in
      // myCheckIns, the feed and the reviews at once.
      await addCheckIn(
        {
          flavour_id: fantaId,
          rating,
          comment: comment.trim(),
          // The shop's location, not yours: the pin belongs on the shop (and it's better for your privacy).
          venue_name: place?.name ?? null,
          latitude: place?.latitude ?? null,
          longitude: place?.longitude ?? null,
        },
        photoUri
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong, try again.');
      setIsSaving(false);
    }
  };

  if (!fanta) {
    return null;
  }

  // The camera replaces the form, so the draft (stars, comment) stays in this screen's state.
  if (isCameraOpen) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <PhotoCamera onPhotoTaken={handlePhotoTaken} onClose={() => setIsCameraOpen(false)} />
      </>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: true, title: `Log ${fanta.name}` }} />
      {/* Android draws edge-to-edge, so without this the keyboard covers the inputs.
          "padding" reserves the keyboard's height at the bottom, so the ScrollView gets smaller and can scroll. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 24, gap: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 12 }}>
            <CanGraphic fanta={fanta} scale={1.4} />
            <ThemedText type="subtitle">How was it?</ThemedText>
            <StarRating rating={rating} size={40} onChange={setRating} />
          </View>

          {photoUri ? (
            <View style={{ gap: 12 }}>
              <Image source={photoUri} style={{ width: '100%', height: 240, borderRadius: 16 }} contentFit="cover" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Retake" variant="secondary" onPress={openCamera} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Remove" variant="secondary" onPress={() => setPhotoUri(null)} />
                </View>
              </View>
            </View>
          ) : (
            <Button label="📷  Add a photo" variant="secondary" onPress={openCamera} />
          )}

          {place ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ThemedText style={{ flex: 1 }}>
                📍 {place.name}{place.address ? ` · ${place.address}` : ''}
              </ThemedText>
              <Pressable onPress={() => setPlace(null)} hitSlop={12} accessibilityLabel="Remove place">
                <ThemedText themeColor="textSecondary">✕</ThemedText>
              </Pressable>
            </View>
          ) : isPickingPlace ? (
            <View style={{ gap: 8 }}>
              <ThemedText type="smallBold">Where did you get it?</ThemedText>
              <PlacePicker onPick={handlePlacePicked} />
              <Button label="Skip" variant="secondary" onPress={() => setIsPickingPlace(false)} />
            </View>
          ) : (
            <Button label="📍  Where did you get it?" variant="secondary" onPress={startPickingPlace} />
          )}

          <TextField
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            onFocus={scrollToComment}
            placeholder="Solid fanta, a bit too sweet…"
            multiline
            maxLength={280}
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}

          <Button
            label={rating === 0 ? 'Tap the stars to rate' : 'Save'}
            onPress={handleSave}
            loading={isSaving}
            disabled={rating === 0}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
