import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: import.meta.env.DEV,
    redirectTo: import.meta.env.DEV 
      ? `${window.location.origin}/auth/callback`
      : `${import.meta.env.VITE_APP_URL}/auth/callback`,
    storageKey: 'animesearch-auth-token',
    storage: {
      getItem: async (key) => {
        const cookies = document.cookie.split(';');
        const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
        return cookie ? cookie.split('=')[1] : null;
      },
      setItem: async (key, value) => {
        document.cookie = `${key}=${value};path=/;secure;samesite=strict;max-age=604800`;
      },
      removeItem: async (key) => {
        document.cookie = `${key}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  },
  global: {
    headers: {
      'x-client-info': 'AnimeSearch@1.0.0',
      'x-application-name': 'AnimeSearch'
    }
  }
});
