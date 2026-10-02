import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { CanGraphic } from '@/components/fanta-can';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { Fanta } from '@/data/fantas';
import { useTheme } from '@/hooks/use-theme';
import { CheckIn } from '@/types/database';

type ReviewCardProps = {
  checkIn: CheckIn;
  isOwn?: boolean; // purple, like "own review always at the top" in the sketch
  fanta?: Fanta; // shown in the community feed, where you need to know which Fanta it's about
  onPress?: () => void;
};

// Used on the Fanta detail screen (reviews) and on Home (community).
// The screen decides what happens when you tap it.
export function ReviewCard({ checkIn, isOwn = false, fanta, onPress }: ReviewCardProps) {
  const theme = useTheme();
  const date = new Date(checkIn.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: isOwn ? theme.accent : theme.backgroundElement,
        opacity: pressed ? 0.8 : 1,
      })}>
      {checkIn.photo_url && <Image source={checkIn.photo_url} style={{ width: '100%', height: 180 }} contentFit="cover" />}

      <View style={{ padding: 12, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ThemedText type="smallBold">{isOwn ? 'You' : checkIn.profile?.username ?? 'Someone'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {date}
          </ThemedText>
        </View>
        {fanta && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CanGraphic fanta={fanta} scale={0.25} />
            <ThemedText type="small">{fanta.name}</ThemedText>
          </View>
        )}
        <StarRating rating={checkIn.rating} />
        {checkIn.comment !== '' && <ThemedText type="small">{checkIn.comment}</ThemedText>}
        {checkIn.venue_name && (
          <ThemedText type="small" themeColor="textSecondary">
            📍 {checkIn.venue_name}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}
