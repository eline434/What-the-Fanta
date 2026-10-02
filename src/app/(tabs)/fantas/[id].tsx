import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CanGraphic } from '@/components/fanta-can';
import { ReviewCard } from '@/components/review-card';
import { SectionTitle } from '@/components/section-title';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FantaSprite, SPRITE_ASPECT_RATIO } from '@/constants/logo';
import { BottomTabInset } from '@/constants/theme';
import { Fanta } from '@/data/fantas';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCatalogueStore } from '@/stores/use-catalogue-store';
import { useCheckInStore } from '@/stores/use-check-in-store';

export default function FantaDetailScreen() {
  // Which Fanta comes from the URL, the Fanta itself from the catalogue store.
  const { id } = useLocalSearchParams<{ id: string }>();
  const fanta = useCatalogueStore((state) => state.fantas.find((fanta) => fanta.id === id));

  // Select the stored value itself. Doing `?? []` inside the selector would create a
  // new array on every call, and Zustand would think the data keeps changing.
  const reviews = useCheckInStore((state) => state.reviewsByFanta[id]);
  const myCheckIns = useCheckInStore((state) => state.myCheckIns);
  const isLoadingReviews = useCheckInStore((state) => state.isLoadingReviews);
  const loadReviews = useCheckInStore((state) => state.loadReviews);
  const userId = useAuthStore((state) => state.session?.user.id);
  const insets = useSafeAreaInsets();

  if (!fanta) {
    return (
      <ThemedView style={{ flex: 1, padding: 24 }}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <ThemedText>This Fanta could not be found. Maybe you are offline?</ThemedText>
      </ThemedView>
    );
  }

  // Derived data: all calculated from the store while rendering.
  const allReviews = reviews ?? [];
  const myReviews = allReviews.filter((review) => review.user_id === userId);
  const otherReviews = allReviews.filter((review) => review.user_id !== userId);
  const hasDrunk = myCheckIns.some((checkIn) => checkIn.flavour_id === id);
  const average = allReviews.length > 0
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
    : null;

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Like the sketch: the FANTA logo at the top, the flavour name big below it. */}
      <Stack.Screen options={{ headerTitle: () => <Image source={FantaSprite} style={{ height: 34, aspectRatio: SPRITE_ASPECT_RATIO }} contentFit="contain" accessibilityLabel="Fanta" />, headerShadowVisible: false }} />
      <FlashList
        // Your own review always at the top, then everyone else's (newest first).
        data={[...myReviews, ...otherReviews]}
        keyExtractor={(review) => review.id}
        renderItem={({ item }) => (
          <ReviewCard
            checkIn={item}
            isOwn={item.user_id === userId}
            onPress={() => router.push({ pathname: '/fantas/review/[id]', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={
          <FantaHeader fanta={fanta} average={average} reviewCount={allReviews.length} hasDrunk={hasDrunk} />
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', padding: 24 }}>
            {isLoadingReviews ? 'Loading reviews…' : 'No reviews yet. Be the first!'}
          </ThemedText>
        }
        refreshing={isLoadingReviews}
        onRefresh={() => loadReviews(id)}
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset }}
      />
    </ThemedView>
  );
}

type FantaHeaderProps = {
  fanta: Fanta;
  average: number | null;
  reviewCount: number;
  hasDrunk: boolean;
};

const FantaHeader = ({ fanta, average, reviewCount, hasDrunk }: FantaHeaderProps) => {
  const theme = useTheme();
  const isSignedIn = useAuthStore((state) => state.status === 'signedIn');

  // Protected in the event handler: not logged in → log in first.
  const handleDrankIt = () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    router.push({ pathname: '/check-in', params: { fantaId: fanta.id } });
  };

  return (
    <View style={{ padding: 16, gap: 16 }}>
      {/* The can in a "spotlight": a lighter purple circle behind it. */}
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
        <View
          style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: theme.backgroundSelected }}
        />
        <CanGraphic fanta={fanta} scale={2} />
      </View>

      <View style={{ gap: 4 }}>
        <ThemedText type="subtitle">{fanta.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {[fanta.category, fanta.status, fanta.zero_sugar ? 'zero sugar' : null].filter(Boolean).join(' · ')}
        </ThemedText>
        {fanta.countries.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Found in: {fanta.countries.join(', ')}
          </ThemedText>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <StarRating rating={average ?? 0} size={22} />
          <ThemedText type="small" themeColor="textSecondary">
            {average === null ? 'No ratings yet' : `${average.toFixed(1)} · ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`}
          </ThemedText>
        </View>

        <Pressable
          onPress={handleDrankIt}
          accessibilityLabel={hasDrunk ? 'Log this Fanta again' : 'I drank this Fanta'}
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hasDrunk ? theme.accent : theme.backgroundElement,
            opacity: pressed ? 0.7 : 1,
          })}>
          <Text style={{ fontSize: 28, color: theme.text }}>✓</Text>
        </Pressable>
      </View>

      <SectionTitle>Reviews</SectionTitle>
    </View>
  );
};
