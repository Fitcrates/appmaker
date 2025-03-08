import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { AuthModal } from './AuthModal';

interface LoginPromptProps {
  type?: 'modal' | 'banner';
  showDelay?: number;
  dismissDuration?: number; 
}

// Greeting modal that appears first
const GreetingModal: React.FC<{ onClose: () => void, onSignInClick: () => void }> = ({ onClose, onSignInClick }) => {
  return (
    // Full screen overlay with higher z-index and pointer events
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 touch-none" style={{height: '100%'}}>
      {/* Centered modal container */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <div className="backgroundMain rounded-lg shadow-xl ring-1 ring-white/20 overflow-hidden">
          {/* Header with anime-inspired graphic */}
          <div className="p-6 text-center text-white">
            <div className="mb-4">
              {/* Will add image logo here once created */}
            </div>
            <h2 className="text-white text-xl font-bold">Welcome to AnimeCrates</h2>
          </div>
          
          {/* Message and buttons */}
          <div className="p-6">
            <div className="mb-6 text-center">
              <h3 className="text-white mb-4">Log in to discover the full potential of AnimeCrates</h3>
              <p className="text-sm text-white">Join our community to rate anime and make personal watchlist</p>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <button 
                onClick={onSignInClick}
                className="w-full cyberpunk-neon-btn text-white py-2 px-4"
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
    </div>
  );
};

// Main wrapper component
const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  type = 'modal', 
  showDelay = 4000,
  dismissDuration = 1 // Default to 1 day
}) => {
  const { user } = useAuth();
  const [showGreetingPrompt, setShowGreetingPrompt] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  
  // Force component to mount properly on mobile
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Ensure component mounts properly
    setIsMounted(true);
    
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
  
  // If user is authenticated or component not mounted, don't render anything
  if (!isMounted || user) {
    return null;
  }
  
  return (
    <>
      {showGreetingPrompt && (
        <GreetingModal onClose={handleDismiss} onSignInClick={handleSignInClick} />
      )}
      
      {showAuthModal && (
        <AuthModal isOpen={true} onClose={handleDismiss} />
      )}
    </>
  );
};

export default LoginPrompt;
