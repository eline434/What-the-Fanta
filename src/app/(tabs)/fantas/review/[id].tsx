import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CanGraphic } from '@/components/fanta-can';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserAvatar } from '@/components/user-avatar';
import { BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCatalogueStore } from '@/stores/use-catalogue-store';
import { useCheckInStore } from '@/stores/use-check-in-store';

export default function ReviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // No new request: you tapped a review that is already in the store, we just look it up.
  // Reviews of a Fanta are not always in the feed (it only has the newest), so look there too.
  const checkIn = useCheckInStore(
    (state) =>
      Object.values(state.reviewsByFanta).flat().find((checkIn) => checkIn.id === id) ??
      state.feed.find((checkIn) => checkIn.id === id) ??
      state.myCheckIns.find((checkIn) => checkIn.id === id)
  );
  const removeCheckIn = useCheckInStore((state) => state.removeCheckIn);
  const fanta = useCatalogueStore((state) => state.fantas.find((fanta) => fanta.id === checkIn?.flavour_id));
  const userId = useAuthStore((state) => state.session?.user.id);

  // Local state: only this screen needs it.
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!checkIn) {
    return (
      <ThemedView style={{ flex: 1, padding: 24 }}>
        <Stack.Screen options={{ title: 'Review' }} />
        <ThemedText themeColor="textSecondary">This review no longer exists.</ThemedText>
      </ThemedView>
    );
  }

  const isOwn = checkIn.user_id === userId;
  const username = checkIn.profile?.username ?? 'Someone';
  const date = new Date(checkIn.created_at).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const deleteCheckIn = async () => {
    setIsDeleting(true);
    try {
      // The store removes it from every list, so the Fanta's reviews and Home update by itself.
      await removeCheckIn(checkIn.id);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this check-in.');
      setIsDeleting(false);
    }
  };

  // Ask first: deleting can't be undone.
  const confirmDelete = () => {
    Alert.alert('Delete this check-in?', 'Your rating, comment and photo will be removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deleteCheckIn },
    ]);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Review' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset }}>
        {checkIn.photo_url && <Image source={checkIn.photo_url} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />}

        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <UserAvatar username={username} avatarUrl={checkIn.profile?.avatar_url ?? null} size={44} />
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">{isOwn ? 'You' : username}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {date}
              </ThemedText>
            </View>
          </View>

          {/* No link here: you came from this Fanta's screen, the back button takes you there. */}
          {fanta && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 16,
                backgroundColor: theme.backgroundElement,
              }}>
              <CanGraphic fanta={fanta} scale={0.6} />
              <ThemedText type="smallBold" style={{ flex: 1 }}>
                {fanta.name}
              </ThemedText>
            </View>
          )}

          <StarRating rating={checkIn.rating} size={28} />
          {checkIn.comment !== '' && <ThemedText>{checkIn.comment}</ThemedText>}
          {checkIn.venue_name && <ThemedText themeColor="textSecondary">📍 Bought at {checkIn.venue_name}</ThemedText>}

          {error && (
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
          )}
          {/* Only on your own check-ins. The database checks this too (RLS: user_id = auth.uid()). */}
          {isOwn && <Button label="Delete check-in" variant="secondary" onPress={confirmDelete} loading={isDeleting} />}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
