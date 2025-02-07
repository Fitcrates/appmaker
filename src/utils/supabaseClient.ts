import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with optimized configuration for mobile
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window?.localStorage,
    flowType: 'pkce',  // Use PKCE flow for better mobile support
    debug: import.meta.env.DEV,  // Enable debug logs only in development
    storageKey: 'anime-search-auth',  // Custom storage key
    cookieOptions: {
      secure: window.location.protocol === 'https:',
    },
    // Set redirect URLs based on environment
    redirectTo: import.meta.env.DEV 
      ? 'http://localhost:3000'  // Development
      : 'https://animecrates.netlify.app'  // Production
  },
  global: {
    headers: {
      'x-client-info': 'AnimeSearch@1.0.0',
    },
  },
});

// Request management
const requestCache: { [key: string]: { promise: Promise<any>; timestamp: number } } = {};
const CACHE_DURATION = 2000; // 2 seconds
const RETRY_DELAY = 1000; // 1 second

// Helper function to retry failed requests
async function retryRequest<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('Failed to fetch') || error.status === 406)) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
}

// Cache-aware query functions
export const queries = {
  getUserRating: async (userId: string, animeId: number) => {
    const key = `rating-${userId}-${animeId}`;
    const now = Date.now();
    
    // Return cached result if available and fresh
    const cached = requestCache[key];
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.promise;
    }

    // Create new request
    const promise = retryRequest(async () => {
      const result = await supabase
        .from('user_feedback')
        .select('rating')
        .eq('user_id', userId)
        .eq('anime_id', animeId)
        .maybeSingle();
      
      if (result.error && result.error.code !== 'PGRST116') {
        throw result.error;
      }
      
      return { data: result.data, error: null };
    });

    // Cache the promise
    requestCache[key] = { promise, timestamp: now };
    
    // Clean up old cache entries
    setTimeout(() => {
      if (requestCache[key]?.timestamp === now) {
        delete requestCache[key];
      }
    }, CACHE_DURATION);

    return promise;
  },

  getWatchlistStatus: async (userId: string) => {
    const key = `watchlist-${userId}`;
    const now = Date.now();
    
    // Return cached result if available and fresh
    const cached = requestCache[key];
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.promise;
    }

    // Create new request
    const promise = retryRequest(async () => {
      const result = await supabase
        .from('anime_watchlist')
        .select('anime_id')
        .eq('user_id', userId);
      
      if (result.error) throw result.error;
      return result;
    });

    // Cache the promise
    requestCache[key] = { promise, timestamp: now };
    
    // Clean up old cache entries
    setTimeout(() => {
      if (requestCache[key]?.timestamp === now) {
        delete requestCache[key];
      }
    }, CACHE_DURATION);

    return promise;
  },

  addToWatchlist: async (userId: string, animeId: number) => {
    const key = `add-watchlist-${userId}-${animeId}`;
    
    // Don't cache this operation, but still use retry logic
    return retryRequest(async () => {
      const result = await supabase
        .from('anime_watchlist')
        .insert({
          user_id: userId,
          anime_id: animeId,
        })
        .select()
        .single();
      
      // Invalidate watchlist cache
      const watchlistKey = `watchlist-${userId}`;
      delete requestCache[watchlistKey];
      
      return result;
    });
  },

  removeFromWatchlist: async (userId: string, animeId: number) => {
    const key = `remove-watchlist-${userId}-${animeId}`;
    
    // Don't cache this operation, but still use retry logic
    return retryRequest(async () => {
      const result = await supabase
        .from('anime_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('anime_id', animeId);
      
      // Invalidate watchlist cache
      const watchlistKey = `watchlist-${userId}`;
      delete requestCache[watchlistKey];
      
      return result;
    });
  },

  // Helper method to clear all caches
  clearCache: () => {
    Object.keys(requestCache).forEach(key => {
      delete requestCache[key];
    });
  }
};
