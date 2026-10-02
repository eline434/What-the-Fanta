import {
    addNotificationResponseReceivedListener,
    askNotificationPermission,
    showNewsNotification,
} from '@/lib/notifications'
import { supabase } from '@/lib/supabase'
import { NewsItem } from '@/types/database'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type NotificationStatus = 'unknown' | 'granted' | 'denied'

interface NewsState {
    news: NewsItem[],
    // Newest news we already showed a notification for, so you never get the same one twice.
    lastNotifiedAt: string | null,
    notificationStatus: NotificationStatus,
    isLoadingNews: boolean,
    loadNews: () => Promise<void>,
    receiveNews: (item: NewsItem) => void,
    enableNotifications: () => Promise<void>,
}

const isNewer = (date: string, than: string) => new Date(date).getTime() > new Date(than).getTime()

export const useNewsStore = create<NewsState>()(
    persist(
        (set, get) => ({
            news: [],
            lastNotifiedAt: null,
            notificationStatus: 'unknown',
            isLoadingNews: false,

            loadNews: async () => {
                set({ isLoadingNews: true })
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20)

                if (error) {
                    // Offline: keep the saved news (see persist below).
                    set({ isLoadingNews: false })
                    return
                }

                const news = data as NewsItem[]
                const { lastNotifiedAt } = get()
                const newest = news[0]?.created_at ?? new Date().toISOString()
                set({ news, isLoadingNews: false, lastNotifiedAt: newest })

                // Very first start: don't send a notification for every old message.
                if (lastNotifiedAt === null) {
                    return
                }
                // News that arrived while the app was closed.
                const unseen = news.filter((item) => isNewer(item.created_at, lastNotifiedAt))
                if (unseen.length > 0) {
                    showNewsNotification(unseen[0], unseen.length - 1)
                }
            },

            // Called by Supabase Realtime while the app is running (see the bottom of this file).
            receiveNews: (item) => {
                if (get().news.some((existing) => existing.id === item.id)) {
                    return
                }
                set((state) => ({ news: [item, ...state.news], lastNotifiedAt: item.created_at }))
                showNewsNotification(item)
            },

            enableNotifications: async () => {
                const isGranted = await askNotificationPermission()
                set({ notificationStatus: isGranted ? 'granted' : 'denied' })
            },
        }),
        {
            name: 'news',
            storage: createJSONStorage(() => AsyncStorage),
            // The news (to read it offline) and what we already notified about.
            partialize: (state) => ({ news: state.news, lastNotifiedAt: state.lastNotifiedAt }),
        }
    )
)

// Everything below runs once, when this file is first imported. No useEffect.

// Wait until the saved lastNotifiedAt has been read from the phone. Otherwise loadNews would
// think it's the very first start and never notify about news that came in while you were away.
const start = () => {
    useNewsStore.getState().loadNews()
}
if (useNewsStore.persist.hasHydrated()) {
    start()
} else {
    useNewsStore.persist.onFinishHydration(start)
}

// Ask for notification permission when the app opens. Android only shows the popup
// the first time, after that this just reads your earlier answer.
useNewsStore.getState().enableNotifications()

// Supabase Realtime: a live connection that tells us when you (as Fanta) add a news row.
supabase
    .channel('news')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, (payload) => {
        useNewsStore.getState().receiveNews(payload.new as NewsItem)
    })
    .subscribe()

// Tapping a notification opens the Home tab, where the news is.
addNotificationResponseReceivedListener(() => {
    router.navigate('/')
})
