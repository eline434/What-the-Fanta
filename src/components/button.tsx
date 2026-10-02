import { ActivityIndicator, Pressable, Text } from 'react-native';

import { DisplayFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? theme.onPrimary : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: isPrimary ? theme.primary : theme.backgroundElement,
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        opacity: pressed || disabled ? 0.6 : 1,
      })}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontSize: 18, fontFamily: DisplayFont }}>{label}</Text>
      )}
    </Pressable>
  );
}
