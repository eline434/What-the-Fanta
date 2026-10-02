import { deletePhoto, uploadPhoto } from '@/lib/photos'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { useCheckInStore } from './use-check-in-store'

type AuthStatus = 'checking' | 'signedIn' | 'signedOut'

type ProfileChanges = Partial<Pick<Profile, 'username' | 'bio'>>

// Supabase's error messages are written for developers, these are for users.
const toFriendlyMessage = (message: string) => {
    if (message.includes('Invalid login credentials')) {
        return 'Wrong email or password.'
    }
    if (message.includes('User already registered')) {
        return 'There is already an account with this email.'
    }
    if (message.includes('Database error saving new user')) {
        // The unique username in the profiles table was already taken (see handle_new_user).
        return 'This username is already taken.'
    }
    if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network')) {
        return 'No internet connection. Try again when you are online.'
    }
    return message
}

interface AuthState {
    session: Session | null,
    profile: Profile | null,
    status: AuthStatus,
    // Both return an error message to show in the form, or null when it worked.
    signUp: (email: string, password: string, username: string) => Promise<string | null>,
    signIn: (email: string, password: string) => Promise<string | null>,
    signOut: () => Promise<void>,
    loadProfile: (userId: string) => Promise<void>,
    // newAvatarUri: a photo on the phone (from the camera), uploaded before saving the profile.
    updateProfile: (changes: ProfileChanges, newAvatarUri?: string | null) => Promise<void>,
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    session: null,
    profile: null,
    status: 'checking',

    // The actions below only talk to Supabase. Updating session/status happens in
    // the onAuthStateChange listener at the bottom, so it's handled in one place.
    signUp: async (email, password, username) => {
        if (username.trim().length < 3) {
            return 'Your username needs at least 3 characters.'
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            // Read by the handle_new_user trigger in schema.sql to create the profile.
            options: { data: { username: username.trim() } },
        })
        return error ? toFriendlyMessage(error.message) : null
    },

    signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? toFriendlyMessage(error.message) : null
    },

    signOut: async () => {
        await supabase.auth.signOut()
    },

    loadProfile: async (userId) => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
        if (!error) {
            set({ profile: data as Profile })
        }
    },

    updateProfile: async (changes, newAvatarUri) => {
        const profile = get().profile
        if (!profile) {
            return
        }
        if (changes.username !== undefined && changes.username.trim().length < 3) {
            throw new Error('Your username needs at least 3 characters.')
        }

        // Same order as a check-in: first the photo, then the row that points to it.
        const avatar_url = newAvatarUri ? await uploadPhoto(newAvatarUri, `avatar-${Date.now()}`) : profile.avatar_url

        const { data, error } = await supabase
            .from('profiles')
            .update({ ...changes, avatar_url })
            .eq('id', profile.id)
            .select()
            .single()

        if (error) {
            throw new Error(error.code === '23505' ? 'This username is already taken.' : error.message)
        }
        // Remove the old avatar from storage, it's not used anymore.
        if (newAvatarUri && profile.avatar_url) {
            deletePhoto(profile.avatar_url)
        }
        set({ profile: data as Profile })
    },
}))

// Registered once, when this file is first imported. Supabase calls it at app start
// (INITIAL_SESSION), after logging in or out, and when the login token is refreshed.
// Everything that should happen *because* the login changed happens here: no useEffect.
// (The public feed doesn't depend on who is logged in, the check-in store loads it itself.)
supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
        useAuthStore.setState({ session: null, profile: null, status: 'signedOut' })
        useCheckInStore.getState().reset()
        return
    }

    useAuthStore.setState({ session, status: 'signedIn' })

    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        const userId = session.user.id
        // Wait until Supabase has finished its own login work before making new requests.
        setTimeout(() => {
            useAuthStore.getState().loadProfile(userId)
            useCheckInStore.getState().loadMyCheckIns(userId)
        }, 0)
    }
})
