import { Pressable, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { DisplayFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AddFantaTileProps = {
  onPress: () => void;
};

// "add a new fanta +" from the sketch: the last tile of the grid, the same size as a can tile.
export function AddFantaTile({ onPress }: AddFantaTileProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Add a new Fanta"
      style={({ pressed }) => ({
        flex: 1,
        margin: 6,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 16,
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.backgroundElement,
        opacity: pressed ? 0.7 : 1,
      })}>
      {/* Same size as a can (52 × 92), so every tile in the grid stays the same height. */}
      <View
        style={{
          width: 52,
          height: 92,
          borderRadius: 10,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: theme.text,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontFamily: DisplayFont, fontSize: 36, color: theme.text }}>+</Text>
      </View>
      <ThemedText type="small" numberOfLines={2} style={{ textAlign: 'center', height: 40 }}>
        Add a new Fanta
      </ThemedText>
    </Pressable>
  );
}
