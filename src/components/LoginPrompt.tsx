import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { AuthModal } from './AuthModal';

interface LoginPromptProps {
  type?: 'modal' | 'banner';
  showDelay?: number;
  dismissDuration?: number; // Duration in days to remember dismissal
}

// Greeting modal that appears first
const GreetingModal: React.FC<{ onClose: () => void, onSignInClick: () => void }> = ({ onClose, onSignInClick }) => {
  return (
    <div className="fixed h-screen inset-0 z-[100] touch-none flex items-center justify-center">
      <div className="backgroundMain rounded-lg ring-1 ring-white/40 shadow-xl overflow-hidden max-w-md w-full">
        {/* Header with anime-inspired graphic */}
        <div className=" p-6 text-center text-white">
          <div className="mb-4">
            {/* WIll add image logo here once created */}


          </div>
          <h2 className="text-white text-xl font-bold">Welcome to AnimeCrates</h2>
        </div>
        
        {/* Message and buttons */}
        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-white mb-4">Log in to discover the full potential of AnimeCrates</p>
            <p className="text-sm text-white">Join our community to rate anime and make personal watchlist</p>
          </div>
          
          {/* Action buttons */}
          <div className="space-y-3">
            <button 
              onClick={onSignInClick}
              className="w-full cyberpunk-neon-btn  text-white py-2 px-4"
            >
              Sign In
            </button>
            
            <button 
              onClick={onClose}
              className="w-full cyberpunk-neon-btn pink text-white py-2 px-4"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Banner component that appears for non-logged users
const LoginPromptBanner: React.FC<{ onSignInClick: () => void, onClose: () => void }> = ({ onSignInClick, onClose }) => {
  return (
    <div className="bg-indigo-100 border-l-4 border-indigo-500 p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-indigo-700">
            Log in to discover the full potential of AnimeCrates
          </p>
        </div>
        <div className="ml-auto flex space-x-2">
          <button 
            onClick={onSignInClick}
            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Sign In
          </button>
          <button 
            onClick={onClose}
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

// Main wrapper component that handles both options
const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  type = 'modal', 
  showDelay = 5000,
  dismissDuration = 1 // Default to 1 day
}) => {
  const { user } = useAuth();
  const [showGreetingPrompt, setShowGreetingPrompt] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const checkDismissed = () => {
      const dismissed = localStorage.getItem('login-prompt-dismissed');
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        // If the dismissal period has expired, show the prompt again
        return (now.getTime() - dismissedDate.getTime()) < (dismissDuration * 24 * 60 * 60 * 1000);
      }
      return false;
    };

    // Only set timer if user is not authenticated and hasn't dismissed recently
    if (!user && !checkDismissed()) {
      const timer = setTimeout(() => {
        setShowGreetingPrompt(true);
      }, showDelay);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [user, showDelay, dismissDuration]);
  
  const handleDismiss = () => {
    setShowGreetingPrompt(false);
    setShowAuthModal(false);
    // Store dismissal timestamp in localStorage
    localStorage.setItem('login-prompt-dismissed', new Date().toISOString());
  };
  
  const handleSignInClick = () => {
    setShowGreetingPrompt(false);
    setShowAuthModal(true);
  };
  
  // If user is authenticated, don't render anything
  if (user) {
    return null;
  }
  
  return (
    <>
      {showGreetingPrompt && (
        type === 'modal' 
          ? <GreetingModal onClose={handleDismiss} onSignInClick={handleSignInClick} />
          : <LoginPromptBanner onClose={handleDismiss} onSignInClick={handleSignInClick} />
      )}
      
      {showAuthModal && (
        <AuthModal isOpen={true} onClose={handleDismiss} />
      )}
    </>
  );
};

export default LoginPrompt;