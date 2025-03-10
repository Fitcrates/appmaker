import React, { useEffect, useState } from 'react';

// Extend Window interface to include Google Analytics properties
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    [key: string]: any; // This allows indexing with string keys like 'ga-disable-G-08E4J4TED7'
  }
}

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

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-08E4J4TED7';

export const CookieConsentManager: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent);

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookieConsent');
    if (!storedConsent) {
      setShowBanner(true);
      // Disable Google Analytics by default until consent is given
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    } else {
      try {
        const parsedConsent = JSON.parse(storedConsent) as CookieConsent;
        setConsent(parsedConsent);
        
        // Apply stored consent settings to Google Analytics
        window[`ga-disable-${GA_MEASUREMENT_ID}`] = !parsedConsent.analytics;
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        // If there's an error parsing, show the banner and use default consent
        setShowBanner(true);
        // Remove the invalid data
        localStorage.removeItem('cookieConsent');
        // Disable Google Analytics until consent is given
        window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      }
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
    
    // Apply consent settings to Google Analytics
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = !newConsent.analytics;
    
    // Reload the page if analytics setting changed to ensure GA is properly initialized/disabled
    const currentConsent = localStorage.getItem('cookieConsent');
    if (currentConsent) {
      try {
        const parsedConsent = JSON.parse(currentConsent) as CookieConsent;
        if (parsedConsent.analytics !== newConsent.analytics) {
          // Only reload if the analytics setting actually changed
          window.location.reload();
        }
      } catch (error) {
        console.error('Error comparing cookie consent:', error);
      }
    }
  };

  if (!showBanner) return null;

  return (
    <div style={{ width: '100vw', height: '12vh' }} className="fixed bottom-0 left-0 bg-gradient-to-t from-[#5003cc] to-[#6120a1] text-white p-3 shadow-lg z-50 ">
      <div className="flex flex-col sm:flex-row items-center gap-2 justify-center mt-0 md:mt-6">
        <div className="items-center justify-center min-w-0 ">
          <p className="text-sm text-white whitespace-normal">
            We use cookies to enhance your experience. Essential cookies are required for basic functionality.
            <a href="/privacy-policy" className="underline hover:text-teal-300 ml-1">
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
            className="px-2 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs whitespace-nowrap transition-colors"
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
      try {
        setConsent(JSON.parse(storedConsent));
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        // If there's an error parsing, use default consent
        setConsent(defaultConsent);
        // Remove the invalid data
        localStorage.removeItem('cookieConsent');
      }
    }
  }, []);

  return consent;
};

export default CookieConsentManager;
