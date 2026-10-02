import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ReviewCard } from '@/components/review-card';
import { SectionTitle } from '@/components/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserAvatar } from '@/components/user-avatar';
import { BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCatalogueStore } from '@/stores/use-catalogue-store';
import { useCheckInStore } from '@/stores/use-check-in-store';

export default function ProfileScreen() {
  const status = useAuthStore((state) => state.status);

  // Which version of the screen you see is calculated from the auth status while rendering.
  if (status === 'signedIn') {
    return <SignedInProfile />;
  }
  return (
    <ThemedView style={{ flex: 1, padding: 24 }}>
      <Stack.Screen options={{ title: 'Profile', headerRight: undefined }} />
      {status === 'checking' ? <ActivityIndicator /> : <SignedOutProfile />}
    </ThemedView>
  );
}

const SignedOutProfile = () => (
  <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
    <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
      Your Fanta diary
    </ThemedText>
    <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
      Log in to keep track of the Fantas you drank, rate them and share photos.
    </ThemedText>
    <Button label="Log in" onPress={() => router.push('/sign-in')} />
    <Button label="Create account" variant="secondary" onPress={() => router.push('/sign-up')} />
  </View>
);

const SignedInProfile = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Your history: already in the store (and saved on the phone), newest first.
  const myCheckIns = useCheckInStore((state) => state.myCheckIns);
  const fantas = useCatalogueStore((state) => state.fantas);

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerRight: () => (
            <Pressable onPress={() => router.push('/edit-profile')} hitSlop={12} accessibilityLabel="Edit profile">
              <SymbolView name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }} tintColor={theme.text} size={24} />
            </Pressable>
          ),
        }}
      />
      <FlashList
        data={myCheckIns}
        keyExtractor={(checkIn) => checkIn.id}
        renderItem={({ item }) => (
          <ReviewCard
            checkIn={item}
            fanta={fantas.find((fanta) => fanta.id === item.flavour_id)}
            // This route lives in the profile folder, so you stay on the Profile tab.
            onPress={() => router.push({ pathname: '/profile/review/[id]', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={<ProfileHeader />}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', padding: 24 }}>
            You haven&apos;t logged a Fanta yet. Find one in the Fantas tab and tap ✓.
          </ThemedText>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset }}
      />
    </ThemedView>
  );
};

const ProfileHeader = () => {
  const profile = useAuthStore((state) => state.profile);
  const email = useAuthStore((state) => state.session?.user.email ?? '');
  const myCheckIns = useCheckInStore((state) => state.myCheckIns);

  // Derived from your history, nothing extra stored.
  const differentFantas = new Set(myCheckIns.map((checkIn) => checkIn.flavour_id)).size;
  const username = profile?.username ?? email;
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <View style={{ alignItems: 'center', padding: 24, gap: 6 }}>
      <UserAvatar username={username} avatarUrl={profile?.avatar_url ?? null} size={104} />
      <ThemedText type="subtitle" style={{ marginTop: 8 }}>
        {username}
      </ThemedText>
      {profile?.bio ? (
        <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
          {profile.bio}
        </ThemedText>
      ) : null}
      {memberSince && (
        <ThemedText type="small" themeColor="textSecondary">
          Member since {memberSince}
        </ThemedText>
      )}
      <ThemedText type="smallBold" style={{ marginTop: 8 }}>
        {myCheckIns.length} {myCheckIns.length === 1 ? 'check-in' : 'check-ins'} · {differentFantas}{' '}
        {differentFantas === 1 ? 'different Fanta' : 'different Fantas'}
      </ThemedText>
      <View style={{ alignSelf: 'flex-start', marginTop: 16 }}>
        <SectionTitle>My Fantas</SectionTitle>
      </View>
    </View>
  );
};
