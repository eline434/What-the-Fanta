import { router } from 'expo-router';

import { useCheckInStore } from '@/stores/use-check-in-store';

// Everything that opens a Fanta (a tap in the grid, a scan) goes through here:
// start loading the reviews and navigate at the same moment. No useEffect in the detail screen.
// Outside a component we can't use the hook, so we talk to the store with getState().
export const openFanta = (fantaId: string) => {
  useCheckInStore.getState().loadReviews(fantaId);
  router.push({ pathname: '/fantas/[id]', params: { id: fantaId } });
};
