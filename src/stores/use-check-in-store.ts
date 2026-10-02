import { deletePhoto, uploadPhoto } from '@/lib/photos'
import { supabase } from '@/lib/supabase'
import { CheckIn, NewCheckIn } from '@/types/database'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Every check-in comes with the username + avatar of whoever wrote it.
const CHECK_IN_SELECT = '*, profile:profiles(username, avatar_url)'

// The feed loads 20 check-ins at a time, the next 20 when you scroll to the bottom.
const FEED_PAGE_SIZE = 20

type FeedStatus = 'loading' | 'ready' | 'error'

interface CheckInState {
    myCheckIns: CheckIn[],
    reviewsByFanta: Record<string, CheckIn[]>,
    feed: CheckIn[],
    feedStatus: FeedStatus,
    hasMoreFeed: boolean,
    isLoadingMoreFeed: boolean,
    isLoadingReviews: boolean,
    error: string | null,
    loadMyCheckIns: (userId: string) => Promise<void>,
    loadFeed: () => Promise<void>,
    loadMoreFeed: () => Promise<void>,
    loadReviews: (fantaId: string) => Promise<void>,
    addCheckIn: (checkIn: NewCheckIn, photoUri?: string | null) => Promise<CheckIn>,
    removeCheckIn: (checkInId: string) => Promise<void>,
    reset: () => void,
}

export const useCheckInStore = create<CheckInState>()(
    persist(
        (set, get) => ({
            myCheckIns: [],
            reviewsByFanta: {},
            feed: [],
            feedStatus: 'loading',
            hasMoreFeed: true,
            isLoadingMoreFeed: false,
            isLoadingReviews: false,
            error: null,

            loadMyCheckIns: async (userId) => {
                const { data, error } = await supabase
                    .from('check_ins')
                    .select(CHECK_IN_SELECT)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })

                // When offline we simply keep the saved copy (see persist below).
                if (!error) {
                    set({ myCheckIns: data as CheckIn[] })
                }
            },

            // Start over with the newest page (app start, pull to refresh).
            loadFeed: async () => {
                set({ feedStatus: 'loading' })
                const { data, error } = await supabase
                    .from('check_ins')
                    .select(CHECK_IN_SELECT)
                    .order('created_at', { ascending: false })
                    .range(0, FEED_PAGE_SIZE - 1)

                if (error) {
                    // Keep what we already had, the screen shows an error message.
                    set({ feedStatus: 'error' })
                    return
                }
                set({
                    feed: data as CheckIn[],
                    feedStatus: 'ready',
                    // A full page means there might be more, a smaller one means we reached the end.
                    hasMoreFeed: data.length === FEED_PAGE_SIZE,
                })
            },

            // The next page, added at the end (you scrolled to the bottom).
            loadMoreFeed: async () => {
                const { feed, feedStatus, hasMoreFeed, isLoadingMoreFeed } = get()
                // The list can report "end reached" several times: only load one page at a time.
                if (feedStatus !== 'ready' || !hasMoreFeed || isLoadingMoreFeed) {
                    return
                }

                set({ isLoadingMoreFeed: true })
                const from = feed.length
                const { data, error } = await supabase
                    .from('check_ins')
                    .select(CHECK_IN_SELECT)
                    .order('created_at', { ascending: false })
                    .range(from, from + FEED_PAGE_SIZE - 1)

                if (error) {
                    set({ isLoadingMoreFeed: false })
                    return
                }
                set((state) => {
                    // If someone posted in the meantime, everything shifted by one: skip doubles.
                    const knownIds = new Set(state.feed.map((checkIn) => checkIn.id))
                    const newCheckIns = (data as CheckIn[]).filter((checkIn) => !knownIds.has(checkIn.id))
                    return {
                        feed: [...state.feed, ...newCheckIns],
                        hasMoreFeed: data.length === FEED_PAGE_SIZE,
                        isLoadingMoreFeed: false,
                    }
                })
            },

            loadReviews: async (fantaId) => {
                set({ isLoadingReviews: true, error: null })
                const { data, error } = await supabase
                    .from('check_ins')
                    .select(CHECK_IN_SELECT)
                    .eq('flavour_id', fantaId)
                    .order('created_at', { ascending: false })

                if (error) {
                    set({ isLoadingReviews: false, error: error.message })
                    return
                }
                set((state) => ({
                    reviewsByFanta: { ...state.reviewsByFanta, [fantaId]: data as CheckIn[] },
                    isLoadingReviews: false,
                }))
            },

            addCheckIn: async (newCheckIn, photoUri) => {
                // First the photo: if that fails, we don't save a check-in without it.
                const photo_url = photoUri ? await uploadPhoto(photoUri) : null

                const { data, error } = await supabase
                    .from('check_ins')
                    .insert({ ...newCheckIn, photo_url })
                    .select(CHECK_IN_SELECT)
                    .single()

                if (error) {
                    throw new Error(error.message)
                }

                // Put the new check-in at the top of every list that shows it,
                // so all screens update at once without reloading anything.
                const checkIn = data as CheckIn
                set((state) => ({
                    myCheckIns: [checkIn, ...state.myCheckIns],
                    feed: [checkIn, ...state.feed],
                    reviewsByFanta: {
                        ...state.reviewsByFanta,
                        [checkIn.flavour_id]: [checkIn, ...(state.reviewsByFanta[checkIn.flavour_id] ?? [])],
                    },
                }))
                return checkIn
            },

            removeCheckIn: async (checkInId) => {
                const { feed, myCheckIns } = get()
                const photoUrl = [...feed, ...myCheckIns].find((checkIn) => checkIn.id === checkInId)?.photo_url

                const { error } = await supabase.from('check_ins').delete().eq('id', checkInId)
                if (error) {
                    throw new Error(error.message)
                }
                // Privacy: also remove the photo itself, not only the row that points to it.
                if (photoUrl) {
                    deletePhoto(photoUrl)
                }

                const withoutIt = (checkIns: CheckIn[]) => checkIns.filter((checkIn) => checkIn.id !== checkInId)
                set((state) => ({
                    myCheckIns: withoutIt(state.myCheckIns),
                    feed: withoutIt(state.feed),
                    reviewsByFanta: Object.fromEntries(
                        Object.entries(state.reviewsByFanta).map(([fantaId, reviews]) => [fantaId, withoutIt(reviews)])
                    ),
                }))
            },

            // Only your own data. The feed and reviews are public, guests see them too.
            reset: () => set({ myCheckIns: [], error: null }),
        }),
        {
            name: 'check-ins',
            storage: createJSONStorage(() => AsyncStorage),
            // Only my own history is saved on the phone, the rest is always loaded fresh.
            partialize: (state) => ({ myCheckIns: state.myCheckIns }),
        }
    )
)

// Check-ins are public (see schema.sql), so the feed loads at app start
// for everyone, logged in or not. Runs once, when this file is first imported.
useCheckInStore.getState().loadFeed()
