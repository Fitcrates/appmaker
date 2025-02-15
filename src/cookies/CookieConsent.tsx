import React, { useEffect, useState } from 'react';

export type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const defaultConsent: CookieConsent = {
  essential: true, // Always true as it's required for basic functionality
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
};

export const CookieConsentManager: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent);

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookieConsent');
    if (!storedConsent) {
      setShowBanner(true);
    } else {
      setConsent(JSON.parse(storedConsent));
    }
  }, []);

  const handleAcceptAll = () => {
    const newConsent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    saveConsent(newConsent);
  };

  const handleEssentialOnly = () => {
    const newConsent: CookieConsent = {
      ...defaultConsent,
      timestamp: new Date().toISOString(),
    };
    saveConsent(newConsent);
  };

  const handleDeclineAll = () => {
    const newConsent: CookieConsent = {
      essential: true, // Keep essential cookies even when declining all
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    saveConsent(newConsent);
  };

  const saveConsent = (newConsent: CookieConsent) => {
    localStorage.setItem('cookieConsent', JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
    
    // Apply consent settings
    if (!newConsent.analytics) {
      // Disable Google Analytics
      window['ga-disable-GA_MEASUREMENT_ID'] = true;
    }
    
    // You can add more cookie management logic here
  };

  if (!showBanner) return null;

  return (
    <div style={{ width: '100vw', height: '10vh' }} className="fixed bottom-0 left-0 bg-white/80 text-black p-3 shadow-lg z-50">
      <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
        <div className="items-center justify-center min-w-0">
          <p className="text-xs text-black whitespace-normal">
            We use cookies to enhance your experience. Essential cookies are required for basic functionality.
            <a href="/privacy-policy" className="underline hover:text-black ml-1">
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="flex flex-row flex-shrink-0 gap-2">
          <button
            onClick={handleDeclineAll}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs whitespace-nowrap transition-colors"
          >
            Decline All
          </button>
          <button
            onClick={handleEssentialOnly}
            className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs whitespace-nowrap transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-2 py-1 bg-green-600 hover:bg-green-500  text-white rounded text-xs whitespace-nowrap transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
  
};  
// Hook to check if cookies are accepted
export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent);

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookieConsent');
    if (storedConsent) {
      setConsent(JSON.parse(storedConsent));
    }
  }, []);

  return consent;
};

export default CookieConsentManager;
