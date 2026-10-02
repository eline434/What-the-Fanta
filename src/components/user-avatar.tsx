import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { DisplayFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type UserAvatarProps = {
  username: string;
  avatarUrl: string | null;
  size?: number;
};

// The profile picture, or the first letter of the username on a yellow circle (like the sketch).
export function UserAvatar({ username, avatarUrl, size = 36 }: UserAvatarProps) {
  const theme = useTheme();
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return <Image source={avatarUrl} style={circle} contentFit="cover" />;
  }
  return (
    <View style={[circle, { backgroundColor: theme.highlight, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: theme.ink, fontFamily: DisplayFont, fontSize: size * 0.5 }}>
        {username.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
