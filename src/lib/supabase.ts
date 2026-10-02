import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or key. Copy .env.example to .env.local and fill in the values.');
}

// One shared client for the whole app.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage, // keeps you logged in after closing the app
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // only needed on web
  },
});

// Only refresh the login token while the app is open.
// This listener lives outside React, so no useEffect is needed.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
