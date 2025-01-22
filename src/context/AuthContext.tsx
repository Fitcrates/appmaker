import { createContext, useContext, useEffect, useState } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  supabase: SupabaseClient;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ message: string; redirectTo: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
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
      setUser(null);
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
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

  const value = {
    user,
    supabase,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resendVerificationEmail,
    resetPassword,
    loading,
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
