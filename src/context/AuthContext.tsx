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
  updateProfile: (updates: { data: { name: string }, customDisplayName?: string }) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from localStorage if available
    const storedSession = localStorage.getItem('anime-search-session');
    if (storedSession) {
      try {
        const { user, expires_at } = JSON.parse(storedSession);
        if (new Date(expires_at) > new Date()) {
          return user;
        } else {
          localStorage.removeItem('anime-search-session');
        }
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('anime-search-session');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(() => {
    // Initialize session expiry from localStorage if available
    const storedSession = localStorage.getItem('anime-search-session');
    if (storedSession) {
      try {
        const { expires_at } = JSON.parse(storedSession);
        const expiryDate = new Date(expires_at);
        if (expiryDate > new Date()) {
          return expiryDate;
        }
      } catch (error) {
        console.error('Error parsing stored session expiry:', error);
      }
    }
    return null;
  });
  const sessionCheckInterval = useRef<NodeJS.Timeout>();
  const lastSessionCheck = useRef<number>(0);
  const navigate = useNavigate();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
        localStorage.setItem('anime-search-session', JSON.stringify({
          user: session.user,
          expires_at: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
        }));
      } else {
        setUser(null);
        setSessionExpiry(null);
        localStorage.removeItem('anime-search-session');
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
      setSessionExpiry(null);
      localStorage.removeItem('anime-search-session');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (!mounted) return;
      
      try {
        if (event === 'SIGNED_IN' && session) {
          // Set basic user state immediately
          setUser(session.user);
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
          
          // Update custom name in background
          updateSessionWithCustomName(session).catch(console.error);
          
          if (window.location.pathname === '/auth/callback') {
            navigate('/', { replace: true });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setSessionExpiry(null);
          localStorage.removeItem('anime-search-session');
          navigate('/', { replace: true });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed');
          // Set basic user state immediately
          setUser(session.user);
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
          
          // Update custom name in background
          updateSessionWithCustomName(session).catch(console.error);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        if (session?.user) {
          setUser(session.user);
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
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
        if (mounted && session) {
          // Set basic user state immediately
          setUser(session.user);
          setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
          
          // Update custom name in background
          updateSessionWithCustomName(session).catch(console.error);
        } else if (mounted) {
          setUser(null);
          setSessionExpiry(null);
        }
        
        if (mounted) {
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Function to fetch and update custom display name
  const fetchAndUpdateCustomName = async (sessionUser: User): Promise<User> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('custom_display_name')
        .eq('id', sessionUser.id)
        .single();

      if (error) throw error;

      if (data?.custom_display_name) {
        // Create a new user object with the custom name
        return {
          ...sessionUser,
          user_metadata: {
            ...sessionUser.user_metadata,
            custom_name: data.custom_display_name
          }
        };
      }
      return sessionUser;
    } catch (error) {
      console.error('Error fetching custom display name:', error);
      return sessionUser;
    }
  };

  // Function to update session with custom name
  const updateSessionWithCustomName = async (session: any) => {
    if (!session?.user) return null;
    
    try {
      const updatedUser = await fetchAndUpdateCustomName(session.user);
      
      // Store the updated session
      const sessionData = {
        user: updatedUser,
        expires_at: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
      };
      
      localStorage.setItem('anime-search-session', JSON.stringify(sessionData));
      setUser(updatedUser);
      setSessionExpiry(new Date(Date.now() + SESSION_TIMEOUT));
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating session:', error);
      return session.user;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSessionExpiry(null);
      localStorage.removeItem('anime-search-session');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error in signOut:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) throw error;
      console.log('Google sign in initiated:', data);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

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

  const updateProfile = async (updates: { data: { name: string }, customDisplayName?: string }) => {
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
          custom_display_name: updates.customDisplayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local user state with the new data
      if (authData.user) {
        if (updates.customDisplayName) {
          authData.user.user_metadata = {
            ...authData.user.user_metadata,
            name: updates.customDisplayName
          };
        }
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
