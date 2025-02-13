import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { signIn, signUp, signInWithGoogle, resendVerificationEmail, resetPassword } = useAuth();

  if (!isOpen) return null;

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!isLogin && !name.trim()) {
      setError('Name is required');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await signUp(email, password, name);
      setSuccessMessage('Registration successful! Please check your email to verify your account.');
      setIsLogin(true); // Switch to login mode after successful registration
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message.includes('already exists')) {
        setError('This email is already registered. Please try logging in or reset your password.');
        setIsLogin(true); // Switch to login mode if email exists
      } else {
        setError(err.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setError('');
      setIsLoading(true);
      await signIn(email.trim(), password);
      onClose(); // Close modal after successful sign-in
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email address. Check your inbox for a verification link.');
      } else {
        setError(error.message || 'Failed to sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsLoading(true);
      await signInWithGoogle();
      onClose(); // Close modal after initiating Google sign-in
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setResendLoading(true);
      await resendVerificationEmail(email);
      setSuccessMessage('Verification email has been resent. Please check your inbox and spam folder.');
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsResetting(true);
      setError('');
      await resetPassword(email);
      setSuccessMessage('If an account exists with this email, you will receive a password reset link.');
      
      // Switch to login mode after sending reset email
      setTimeout(() => {
        setIsLogin(true);
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to send reset email. Please try again later.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] touch-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      
      {/* Modal Content */}
      <div className="fixed inset-0 sm:inset-4 md:inset-8 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 w-full max-w-md relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Log In' : 'Create Account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
            {error.toLowerCase().includes('verification') && (
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
              >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">
              {successMessage}
            </div>
          )}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            
            <div className="text-xs text-gray-500 text-center px-4">
              <p>Project ID (dpnyyagodhcucotxllgx.supabase.co) is our Supabase secure authentication provider. 
              Your data is protected and handled with industry-standard security measures.</p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleSignIn} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={isLogin ? "Your password" : "Create a password (min. 6 characters)"}
              />
            </div>
            {isLogin && (
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {isResetting ? 'Sending...' : 'Forgot your password?'}
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading
                ? 'Please wait...'
                : isLogin
                ? 'Log In'
                : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccessMessage('');
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isLogin
                ? "Don't have an account? Register account"
                : 'Already have an account? Log in'}
            </button>
          </div>

          
            </div>
          </div>
        </div>
   
  );
}
