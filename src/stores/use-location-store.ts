import { Coordinates, Place, searchShops } from '@/lib/foursquare'
import * as Location from 'expo-location'
import { create } from 'zustand'

type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'error'

interface LocationState {
    position: Coordinates | null,
    status: LocationStatus,
    nearbyShops: Place[],
    isLoadingShops: boolean,
    shopsError: string | null,
    locateMe: () => Promise<Coordinates | null>,
    findShopsNearMe: () => Promise<Coordinates | null>,
}

// Your position (never saved anywhere) and the shops around you for the check-in screen.
// Everything starts from an event (a button press, the map being ready), never from a useEffect.
export const useLocationStore = create<LocationState>()((set, get) => ({
    position: null,
    status: 'idle',
    nearbyShops: [],
    isLoadingShops: false,
    shopsError: null,
    locateMe: async () => {
        set({ status: 'locating' })

        // Shows Android's permission popup the first time, afterwards it just returns the answer.
        const { granted } = await Location.requestForegroundPermissionsAsync()
        if (!granted) {
            set({ status: 'denied' })
            return null
        }

        try {
            // Balanced = about 100 m accurate: good enough to find shops, faster and uses less battery.
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            const position = { latitude: location.coords.latitude, longitude: location.coords.longitude }
            set({ position, status: 'ready' })
            return position
        } catch {
            // For example when location is switched off on the phone.
            set({ status: 'error' })
            return null
        }
    },

    findShopsNearMe: async () => {
        const position = await get().locateMe()
        if (!position) {
            return null
        }

        set({ isLoadingShops: true, shopsError: null })
        try {
            const nearbyShops = await searchShops(position, 2000) // 2 km around you
            set({ nearbyShops, isLoadingShops: false })
        } catch (e) {
            set({ isLoadingShops: false, shopsError: e instanceof Error ? e.message : 'Could not load shops.' })
        }
        return position
    },
}))
