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
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 touch-none" style={{height: '100%'}}>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <div className="backgroundMain rounded-lg shadow-xl ring-1 ring-white/20 overflow-hidden">
          {/* Header with anime-inspired graphic */}
          <div className="p-6 text-center text-white">
            <div className="mb-4">
              {/* Will add image logo here once created */}
            </div>
            <h1 className="text-white text-3xl font-bold">Welcome to AnimeCrates</h1>
          </div>
          
          {/* Message and buttons */}
          <div className="p-6">
            <div className="mb-6 text-center">
              <h3 className="text-white mb-2 text-xl">Log in to discover the full potential of AnimeCrates</h3>
              <p className="text-sm text-white">Join our community to rate anime and make personal watchlist</p>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3 m-2">
              <button 
                onClick={onSignInClick}
                className="w-full cyberpunk-neon-btn text-white py-2 px-4"
              >
                Sign In
              </button>
              
              <button 
                onClick={onClose}
                className="w-full ring-1 ring-white/40 rounded-xl text-white py-2 px-4"
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
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    // Detect if we're on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|IEMobile|Opera Mini/i.test(userAgent);
    };
    
    setIsMobile(checkMobile());
    
    // Check if user has previously dismissed the prompt
    const checkDismissed = () => {
      try {
        const dismissed = localStorage.getItem('login-prompt-dismissed');
        if (dismissed) {
          const dismissedDate = new Date(dismissed);
          const now = new Date();
          // If the dismissal period has expired, show the prompt again
          return (now.getTime() - dismissedDate.getTime()) < (dismissDuration * 24 * 60 * 60 * 1000);
        }
        return false;
      } catch (error) {
        console.error("Error checking localStorage:", error);
        return false;
      }
    };

    // Only set timer if user is not authenticated and hasn't dismissed recently
    if (!user && !checkDismissed()) {
      // For mobile, use a shorter delay to ensure it triggers before any potential issues
      const delay = isMobile ? Math.min(1000, showDelay) : showDelay;
      
      console.log("Setting timeout to show greeting prompt...");
      const timer = setTimeout(() => {
        console.log("Showing greeting prompt now");
        setShowGreetingPrompt(true);
      }, delay);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [user, showDelay, dismissDuration]);
  
  // Force trigger for mobile if needed
  useEffect(() => {
    if (isMobile && !user && !showGreetingPrompt && !showAuthModal) {
      // Force modal to show on mobile after a short delay if it hasn't shown yet
      const forceTrigger = setTimeout(() => {
        const dismissed = localStorage.getItem('login-prompt-dismissed');
        if (!dismissed) {
          console.log("Force triggering greeting prompt for mobile");
          setShowGreetingPrompt(true);
        }
      }, 2000);
      
      return () => clearTimeout(forceTrigger);
    }
  }, [isMobile, user, showGreetingPrompt, showAuthModal]);
  
  const handleDismiss = () => {
    setShowGreetingPrompt(false);
    setShowAuthModal(false);
    
    try {
      // Store dismissal timestamp in localStorage
      localStorage.setItem('login-prompt-dismissed', new Date().toISOString());
    } catch (error) {
      console.error("Error setting localStorage:", error);
    }
  };
  
  const handleSignInClick = () => {
    setShowGreetingPrompt(false);
    setShowAuthModal(true);
  };
  
  // If user is authenticated, don't render anything
  if (user) {
    return null;
  }
  
  // For testing purposes - uncomment this line to force the modal to show
  // if (!showGreetingPrompt && !showAuthModal) setShowGreetingPrompt(true);
  
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
