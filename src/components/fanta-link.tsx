import { type PropsWithChildren } from 'react';
import { Pressable } from 'react-native';

import { openFanta } from '@/lib/open-fanta';

type FantaLinkProps = PropsWithChildren<{
  fantaId: string;
}>;

// Use this everywhere you can tap a Fanta (grid, profile, home).
// openFanta starts loading the reviews and navigates at the same moment.
export function FantaLink({ fantaId, children }: FantaLinkProps) {
  return (
    <Pressable onPress={() => openFanta(fantaId)} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}>
      {children}
    </Pressable>
  );
}
