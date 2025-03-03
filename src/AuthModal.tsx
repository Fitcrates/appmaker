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
    <div className="fixed h-screen inset-0 z-[100] touch-none flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed  " />
      
      {/* Modal Content */}
      <div className="w-full max-w-md mx-auto relative z-[10000] p-4">
        <div className="backgroundMain rounded-lg p-8 w-full shadow-xl max-h-[90vh] overflow-y-auto ring-1 ring-white/20">
        <div className="flex justify-end">
        <button
              onClick={onClose}
              className="relative  p-2 hover:bg-red-500  text-white hover:text-black rounded-full transition-colors flex-shrink-0 justify-end"
            >
              <X className="h-5 w-5" />
            </button>
</div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
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
              className="w-full flex items-center justify-center gap-2 text-white cyberpunk-neon-btn"
              disabled={isLoading}
            >
              <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            
            <div className="text-xs text-white/80 text-center px-4 mb-6">
              <p>Project ID (dpnyyagodhcucotxllgx.supabase.co) is our Supabase secure authentication provider. 
              Your data is protected and handled with industry-standard security measures.</p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full mb-6 border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className=" text-white">Or continue with email</span>
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
                  className="w-full px-4 py-2 bg-white/20 placeholder:text-white text-white border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 placeholder:text-white text-white border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 placeholder:text-white text-white border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder={isLogin ? "Your password" : "Create a password (min. 6 characters)"}
              />
            </div>
            {isLogin && (
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] "
                >
                  {isResetting ? 'Sending...' : 'Forgot your password?'}
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 cyberpunk-neon-btn text-white rounded-lg gap-2 hover:shadow-lg hover:shadow-[#40a3ff]/50"
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
              className="bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon2"
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