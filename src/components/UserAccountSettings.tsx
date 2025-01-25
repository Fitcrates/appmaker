import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function UserAccountSettings() {
  const { user, updatePassword, updateProfile, deleteAccount } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDisplayNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (!displayName.trim()) {
        throw new Error('Display name cannot be empty');
      }

      await updateProfile({ data: { name: displayName.trim() } });
      setMessage('Display name updated successfully');
    } catch (err: any) {
      console.error('Error updating display name:', err);
      setError(err.message || 'Failed to update display name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (!newPassword.trim()) {
        throw new Error('Password cannot be empty');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      await updatePassword(newPassword);
      setMessage('Password updated successfully');
      setNewPassword('');
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setError(null);
      setMessage(null);
      setIsLoading(true);

      try {
        await deleteAccount();
        setMessage('Account deleted successfully');
      } catch (err: any) {
        console.error('Error deleting account:', err);
        setError(err.message || 'Failed to delete account. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto mt-4">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleDisplayNameChange} className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Change Display Name</h3>
          <div className="mb-4">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Display Name'}
          </button>
        </form>

        <form onSubmit={handlePasswordReset} className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Reset Password</h3>
          <div className="mb-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div>
          <h3 className="text-xl font-semibold mb-4">Delete Account</h3>
          <button
            onClick={handleAccountDeletion}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-red-300"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
