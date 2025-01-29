import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { supabase, queries } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  supabase: SupabaseClient;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ message: string; redirectTo: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean }>;
  updateProfile: (updates: { data: { name: string } }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  loading: boolean;
  sessionExpiry: Date | null;
  refreshSession: () => Promise<void>;
}

const SESSION_TIMEOUT = import.meta.env.VITE_SESSION_TIMEOUT 
  ? parseInt(import.meta.env.VITE_SESSION_TIMEOUT) 
  : 3600000; // 1 hour default

const REFRESH_THRESHOLD = import.meta.env.VITE_REFRESH_THRESHOLD 
  ? parseInt(import.meta.env.VITE_REFRESH_THRESHOLD) 
  : 300000; // 5 minutes default

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const sessionCheckInterval = useRef<NodeJS.Timeout>();
  const lastSessionCheck = useRef<number>(0);
  const authStateSubscription = useRef<{ subscription?: { unsubscribe: () => void } }>({});

  const checkAndRefreshSession = useCallback(async () => {
    if (!sessionExpiry) return;

    const now = new Date();
    const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();

    // Only refresh if we're within the threshold and haven't checked recently
    if (timeUntilExpiry <= REFRESH_THRESHOLD && Date.now() - lastSessionCheck.current > 30000) {
      lastSessionCheck.current = Date.now();
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        if (session) {
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
        await signOut();
      }
    }
  }, [sessionExpiry]);

  // Handle visibility change for mobile browsers
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session on visibility change:', error);
          return;
        }
        
        if (session) {
          setUser(session.user);
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
        } else if (user) {
          // If we had a user but no session, try to refresh
          await checkAndRefreshSession();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkAndRefreshSession]);

  // Set up auth state listener once on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
      } else {
        setSessionExpiry(null);
      }
      setLoading(false);
    });

    authStateSubscription.current.subscription = subscription;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session) {
        setUser(session.user);
        setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
      }
      setLoading(false);
    });

    return () => {
      if (authStateSubscription.current.subscription) {
        authStateSubscription.current.subscription.unsubscribe();
      }
    };
  }, []);

  // Refresh session handler exposed to components
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session) {
        setUser(session.user);
        setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
      }
    } catch (error) {
      console.error('Error in refreshSession:', error);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // First check if the email already exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1);

      if (searchError) throw searchError;

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('An account with this email already exists. Please try logging in or reset your password.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      // Create user profile in users table
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert([
          {
            id: data.user.id,
            email: email,
            name: name,
          },
        ]);

        if (profileError) throw profileError;
      }

      return data;
    } catch (error: any) {
      console.error('Signup process error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        throw new Error(
          'Please verify your email before signing in. Check your inbox for the verification link.'
        );
      }
      if (error.status === 400) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('No user data returned from authentication');
    }

    return data;
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
            client_name: 'AnimeSearch',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user state
      setUser(null);
      setSessionExpiry(null);

      // Clear all caches
      queries.clearCache(); // Clear API request cache
      localStorage.clear(); // Clear local storage
      sessionStorage.clear(); // Clear session storage
      
      // Clear any IndexedDB data
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      });

      // Clear service worker caches if any
      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
        } catch (e) {
          console.error('Error clearing caches:', e);
        }
      }

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes('already confirmed')) {
        throw new Error('This email is already verified. Please try signing in.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Please wait a few minutes before requesting another verification email.');
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const RETRY_DELAY = 60000; // 60 seconds
    const lastAttemptTime = parseInt(localStorage.getItem('lastPasswordResetAttempt') || '0');
    const now = Date.now();

    if (lastAttemptTime && (now - lastAttemptTime) < RETRY_DELAY) {
      const waitSeconds = Math.ceil((RETRY_DELAY - (now - lastAttemptTime)) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting another reset email.`);
    }

    try {
      // First check if the email exists
      const { data: users } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1);

      if (!users || users.length === 0) {
        throw new Error('No account found with this email address.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.toLowerCase().includes('rate limit')) {
          localStorage.setItem('lastPasswordResetAttempt', now.toString());
          throw new Error('Too many reset attempts. Please try again in 60 seconds.');
        }
        throw error;
      }

      // Store the attempt time only on success
      localStorage.setItem('lastPasswordResetAttempt', now.toString());
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: { data: { name: string } }) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update auth metadata first
      const { data: authData, error: updateError } = await supabase.auth.updateUser({
        data: { name: updates.data.name }
      });

      if (updateError) throw updateError;

      // Update users table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({ 
          id: user.id,
          name: updates.data.name,
          email: user.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local user state with the new data from auth
      if (authData.user) {
        setUser(authData.user);
      }

    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('No user logged in');

    try {
      // Delete user's feedback/ratings
      const { error: deleteFeedbackError } = await supabase
        .from('user_feedback')
        .delete()
        .eq('user_id', user.id);

      if (deleteFeedbackError) throw deleteFeedbackError;

      // Delete user's watchlist
      const { error: deleteWatchlistError } = await supabase
        .from('anime_watchlist')
        .delete()
        .eq('user_id', user.id);

      if (deleteWatchlistError) throw deleteWatchlistError;

      // Delete user data from users table
      const { error: deleteUserDataError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteUserDataError) throw deleteUserDataError;

      // Mark the user's auth account as deleted
      const { error: deleteAuthError } = await supabase.auth.updateUser({
        data: { deleted: true }
      });

      if (deleteAuthError) throw deleteAuthError;

      // Sign out the user
      await signOut();

      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to home page
      window.location.href = '/';

    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const value = {
    user,
    supabase,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resendVerificationEmail,
    resetPassword,
    updateProfile,
    deleteAccount,
    loading,
    sessionExpiry,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
