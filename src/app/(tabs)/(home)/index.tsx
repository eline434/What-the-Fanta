import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { type PropsWithChildren } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FantaMap } from '@/components/fanta-map';
import { NewsCard } from '@/components/news-card';
import { ReviewCard } from '@/components/review-card';
import { SectionTitle } from '@/components/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LOGO_ASPECT_RATIO, WhatTheFantaLogo } from '@/constants/logo';
import { BottomTabInset, Colors, DisplayFont } from '@/constants/theme';
import { openFanta } from '@/lib/open-fanta';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCatalogueStore } from '@/stores/use-catalogue-store';
import { useCheckInStore } from '@/stores/use-check-in-store';
import { useNewsStore } from '@/stores/use-news-store';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isLoadingNews = useNewsStore((state) => state.isLoadingNews);
  const loadNews = useNewsStore((state) => state.loadNews);
  const feed = useCheckInStore((state) => state.feed);
  const feedStatus = useCheckInStore((state) => state.feedStatus);
  const loadFeed = useCheckInStore((state) => state.loadFeed);
  const loadMoreFeed = useCheckInStore((state) => state.loadMoreFeed);
  const fantas = useCatalogueStore((state) => state.fantas);
  const userId = useAuthStore((state) => state.session?.user.id);

  // Pulling down is an event: reload the news and start the feed over.
  const refresh = () => {
    loadNews();
    loadFeed();
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* No header bar: the big logo at the top of the list is the header, like the sketch. */}
      <Stack.Screen options={{ headerShown: false }} />
      {/* One scrolling list: the news is the header, the community check-ins are the items. */}
      <FlashList
        data={feed}
        keyExtractor={(checkIn) => checkIn.id}
        // The same card as the reviews on a Fanta's screen. Tap it to open that Fanta.
        renderItem={({ item }) => (
          <ReviewCard
            checkIn={item}
            isOwn={item.user_id === userId}
            fanta={fantas.find((fanta) => fanta.id === item.flavour_id)}
            onPress={() => openFanta(item.flavour_id)}
          />
        )}
        ListHeaderComponent={<HomeHeader />}
        ListEmptyComponent={<FeedEmpty />}
        ListFooterComponent={<FeedFooter />}
        // Event from the list: you scrolled (almost) to the bottom, so load the next 20.
        onEndReached={loadMoreFeed}
        onEndReachedThreshold={0.5}
        refreshing={isLoadingNews || (feedStatus === 'loading' && feed.length > 0)}
        onRefresh={refresh}
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset }}
      />
    </ThemedView>
  );
}

const HomeHeader = () => {
  const insets = useSafeAreaInsets();
  const news = useNewsStore((state) => state.news);
  const feedStatus = useCheckInStore((state) => state.feedStatus);
  const hasFeed = useCheckInStore((state) => state.feed.length > 0);

  return (
    <View style={{ padding: 16, paddingTop: insets.top + 16, gap: 24 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
        <MysteryMarks />
        <Image source={WhatTheFantaLogo} style={{ width: 240, aspectRatio: LOGO_ASPECT_RATIO }} contentFit="contain" accessibilityLabel="What the Fanta" />
      </View>

      <NotifyBanner />

      <Section title="News from Fanta">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
        {news.length === 0 && <EmptyText>No news yet.</EmptyText>}
      </Section>

      {/* "location's with fanta" from the sketch: under the news, like the notifications + map on sketch 1. */}
      <Section title="Where to find Fanta">
        <FantaMap />
      </Section>

      <Section title="Community">
        {/* Refresh failed, but we still show the check-ins we already had. */}
        {feedStatus === 'error' && hasFeed && (
          <ThemedText type="small" themeColor="danger">
            Couldn&apos;t refresh the community. Pull down to try again.
          </ThemedText>
        )}
      </Section>
    </View>
  );
};

// Shown when the feed has no items: still loading, failed, or really empty.
const FeedEmpty = () => {
  const feedStatus = useCheckInStore((state) => state.feedStatus);

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      {feedStatus === 'loading' && <ActivityIndicator />}
      <EmptyText>
        {feedStatus === 'loading'
          ? 'Loading check-ins…'
          : feedStatus === 'error'
            ? "Couldn't load the community. Pull down to try again."
            : 'No check-ins yet. Log a Fanta to be the first!'}
      </EmptyText>
    </View>
  );
};

// Below the last card: loading the next page, or the end of the feed.
const FeedFooter = () => {
  const hasFeed = useCheckInStore((state) => state.feed.length > 0);
  const hasMoreFeed = useCheckInStore((state) => state.hasMoreFeed);
  const isLoadingMoreFeed = useCheckInStore((state) => state.isLoadingMoreFeed);

  if (isLoadingMoreFeed) {
    return <ActivityIndicator style={{ padding: 16 }} />;
  }
  if (hasFeed && !hasMoreFeed) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', padding: 16 }}>
        You&apos;ve seen everything
      </ThemedText>
    );
  }
  return null;
};

// Permission is asked when the app opens (see use-news-store). This only shows up when you said no.
const NotifyBanner = () => {
  const notificationStatus = useNewsStore((state) => state.notificationStatus);

  if (notificationStatus !== 'denied') {
    return null;
  }
  return (
    <View style={{ gap: 8 }}>
      <ThemedText type="small" themeColor="textSecondary">
        Notifications are off. Turn them on in your phone settings to hear about new Fantas.
      </ThemedText>
      <Button label="Open settings" variant="secondary" onPress={() => Linking.openSettings()} />
    </View>
  );
};

const Section = ({ title, children }: PropsWithChildren<{ title: string }>) => (
  <View style={{ gap: 12 }}>
    <SectionTitle>{title}</SectionTitle>
    {children}
  </View>
);

// Big faint question marks behind the logo: the "What the Fanta" mystery flavour idea.
const MARKS = [
  { top: -10, left: 4, size: 90, rotate: '-18deg' },
  { top: 40, right: 0, size: 70, rotate: '20deg' },
  { bottom: -20, left: 60, size: 56, rotate: '10deg' },
  { top: -16, right: 70, size: 44, rotate: '-8deg' },
];

const MysteryMarks = () => (
  <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
    {MARKS.map(({ size, rotate, ...position }, index) => (
      <Text
        key={index}
        style={{
          position: 'absolute',
          ...position,
          fontFamily: DisplayFont,
          fontSize: size,
          color: Colors.light.backgroundSelected,
          transform: [{ rotate }],
        }}>
        ?
      </Text>
    ))}
  </View>
);

const EmptyText = ({ children }: PropsWithChildren) => (
  <ThemedText type="small" themeColor="textSecondary">
    {children}
  </ThemedText>
);
