import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { NewsItem } from '@/types/database';

type NewsCardProps = {
  item: NewsItem;
};

// A message from "Fanta", like the 🔔 rows in the sketch: bell, text, small image on the right.
export function NewsCard({ item }: NewsCardProps) {
  const theme = useTheme();
  const date = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: theme.backgroundElement,
        alignItems: 'center',
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.backgroundSelected,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontSize: 20 }}>🔔</Text>
      </View>
      {/* flex: 1 lets the text take the rest of the width and wrap, instead of pushing out of the card. */}
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ThemedText type="smallBold">
            Fanta 🍊
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {date}
          </ThemedText>
        </View>
        <ThemedText type="small">{item.message}</ThemedText>
      </View>
      {item.image_url && (
        <Image source={item.image_url} style={{ width: 64, height: 64, borderRadius: 12 }} contentFit="cover" />
      )}
    </View>
  );
}
