import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const UserAccountSettings = () => {
  const { user, signOut, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomDisplayName = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('custom_display_name')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          
          // Use custom display name if available, otherwise use the one from auth metadata
          setDisplayName(data?.custom_display_name || user.user_metadata?.name || '');
        } catch (err) {
          console.error('Error fetching custom display name:', err);
          setDisplayName(user.user_metadata?.name || '');
        }
      }
    };

    fetchCustomDisplayName();
  }, [user]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const handleDisplayNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateProfile({
        data: { name: displayName.trim() },
        customDisplayName: displayName.trim()
      });
      setSuccessMessage('Display name updated successfully');
    } catch (err: any) {
      console.error('Error updating display name:', err);
      setError(err.message || 'Failed to update display name');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      
      setSuccessMessage('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signOut();
      navigate('/');
    } catch (error) {
      setError('Error signing out');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      setError(null);

      // Delete user data from all tables
      const { error: ratingsError } = await supabase
        .from('user_feedback')
        .delete()
        .eq('user_id', user.id);

      if (ratingsError) throw ratingsError;

      const { error: watchlistError } = await supabase
        .from('anime_watchlist')
        .delete()
        .eq('user_id', user.id);

      if (watchlistError) throw watchlistError;

      // Delete user account from auth.users
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) throw deleteError;

      await signOut();
      navigate('/');
      setSuccessMessage('Account successfully deleted');
    } catch (error) {
      setError('Error deleting account');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to access account settings</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 backgroundMain">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] mt-24  mb-4  tilt-neon">Account Settings</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="flex flex-col bg-white/10  backdrop-blur-sm shadow rounded-lg p-6 mb-6 ring-1 ring-white/30 mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-white">Profile Information</h2>
          <div className="mb-4">
            <label className="block text-white font-medium mb-2">Email</label>
            <p className="text-white">{user.email}</p>
          </div>
          
          <form onSubmit={handleDisplayNameChange} className="mb-4">
            <div className="mb-4">
              <label htmlFor="displayName" className="block text-white font-medium mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/20 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 
                focus:ring-[#5D0247]"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="mx-auto  flex flex-row rounded-lg items-center justify-center
               cyberpunk-neon-btn text-white"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Updating...
                </span>
              ) : (
                'Update Display Name'
              )}
            </button>
            </div>
          </form>
        </div>

        <div className="bg-white/10 backdrop-blur-sm shadow rounded-lg p-6 mb-6 ring-1 ring-white/30">
          <h2 className="text-xl font-semibold mb-4 text-white">Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-white font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/20 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 
                focus:ring-[#5D0247]"
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-white font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/20 text-white px-3 py-2  rounded-lg focus:outline-none focus:ring-1 
                "
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-row  mx-auto cyberpunk-neon-btn items-center justify-center text-white"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Updating Password...
                </span>
              ) : (
                'Update Password'
              )}
            </button>
            </div>
          </form>
        </div>

        <div className="bg-white/10 backdrop-blur-sm shadow rounded-lg p-6 mb-6 ring-1 ring-white/30">
          <h2 className="text-xl font-semibold mb-4 text-white">Account Actions</h2>
          <div className="space-y-4">
            <div className="flex items-center">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="mx-auto w-[14rem] flex flex-row rounded-lg items-center justify-center py-2
               cyberpunk-neon-btn pink text-white"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Signing out...
                </span>
              ) : (
                'Sign Out'
              )}
            </button>
            </div>
<div className="flex justify-center">
            <button
              onClick={handleDeleteAccount}
              disabled={isLoading}
              className="mx-auto  w-[14rem] flex flex-row rounded-lg items-center justify-center py-2
               cyberpunk-neon-btn red text-white"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Deleting account...
                </span>
              ) : (
                'Delete Account'
              )}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccountSettings;
