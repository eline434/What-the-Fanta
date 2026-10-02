import { Text } from 'react-native';

import { DisplayFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionTitleProps = {
  children: string;
};

// "NEWS FROM FANTA", "COMMUNITY", "REVIEWS", "MY FANTAS": the same heading everywhere.
export function SectionTitle({ children }: SectionTitleProps) {
  const theme = useTheme();

  return (
    <Text style={{ fontFamily: DisplayFont, fontSize: 20, color: theme.heading, letterSpacing: 0.5 }}>
      {children.toUpperCase()}
    </Text>
  );
}
