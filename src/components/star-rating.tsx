import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type StarRatingProps = {
  rating: number; // may be a decimal (an average), it's rounded to whole stars
  size?: number;
  onChange?: (rating: number) => void; // pass this to make the stars tappable
};

const STARS = [1, 2, 3, 4, 5];

export function StarRating({ rating, size = 16, onChange }: StarRatingProps) {
  const theme = useTheme();
  const filled = Math.round(rating);

  return (
    <View style={{ flexDirection: 'row', gap: size / 5 }}>
      {STARS.map((star) => {
        const icon = (
          <Text
            style={{
              fontSize: size,
              lineHeight: size * 1.2,
              color: star <= filled ? theme.highlight : theme.textSecondary,
              // A thin dark edge, so yellow stars stay visible on every purple.
              textShadowColor: theme.ink,
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 1,
            }}>
            {star <= filled ? '★' : '☆'}
          </Text>
        );

        return onChange ? (
          <Pressable key={star} onPress={() => onChange(star)} hitSlop={6} accessibilityLabel={`${star} stars`}>
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}
