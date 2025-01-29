import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  // Enhanced session refresh
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
        throw error;
      }
      if (session) {
        setUser(session.user);
        setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
        // Store session in localStorage for persistence
        localStorage.setItem('anime-search-session', JSON.stringify({
          user: session.user,
          expires_at: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
        }));
      }
    } catch (error) {
      console.error('Error in refreshSession:', error);
      await signOut();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      // Only proceed if component is still mounted
      if (!mounted) return;
      
      if (event === 'SIGNED_IN') {
        if (!session) return;
        
        try {
          // Check if we're in the callback page
          if (window.location.pathname === '/auth/callback') {
            // Let the callback component handle the navigation
            return;
          }

          setUser(session.user);
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
          localStorage.setItem('anime-search-session', JSON.stringify({
            user: session.user,
            expires_at: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
          }));
        } catch (error) {
          console.error('Error in SIGNED_IN:', error);
          setUser(session.user);
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSessionExpiry(null);
        localStorage.removeItem('anime-search-session');
        navigate('/login', { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        if (session && mounted) {
          setUser(session.user);
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
          localStorage.setItem('anime-search-session', JSON.stringify({
            user: session.user,
            expires_at: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
          }));
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session) {
            setUser(session.user);
            setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
          } else {
            setUser(null);
            setSessionExpiry(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Session expiry checker
  useEffect(() => {
    if (!user || !sessionExpiry) return;

    const checkInterval = setInterval(() => {
      if (sessionExpiry && new Date() > sessionExpiry) {
        signOut().catch(console.error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [user, sessionExpiry]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        return {
          message: 'Registration successful! Please check your email for verification.',
          redirectTo: '/login',
        };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Error in signUp:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error('No session after sign in');

      setUser(data.session.user);
      setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
      localStorage.setItem('anime-search-session', JSON.stringify({
        user: data.session.user,
        expires_at: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
      }));
    } catch (error: any) {
      console.error('Error in signIn:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSessionExpiry(null);
      localStorage.removeItem('anime-search-session');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error in signOut:', error);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
