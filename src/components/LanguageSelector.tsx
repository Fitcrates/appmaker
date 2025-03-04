import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Language {
  code: string;
  name: string;
}

interface LanguageSelectorProps {
  position?: 'navbar' | 'footer'; // Default will be 'navbar'
}

// Define Google Translate types
declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: {
          getInstance: () => any;
          InlineLayout: {
            HORIZONTAL: number;
          };
        };
      };
    };
  }
}

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'pl', name: 'Polski' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

export function LanguageSelector({ position = 'navbar' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [isTranslateReady, setIsTranslateReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Determine if dropdown should open upward (for footer)
  const openUpward = position === 'footer';

  // Function to hide Google Translate banner without breaking functionality
  const hideGoogleTranslateBanner = () => {
    // Target all possible banner elements
    const selectors = [
      '.goog-te-banner-frame',
      'iframe.goog-te-banner-frame',
      '.goog-te-banner-frame.skiptranslate',
      '.VIpgJd-ZVi9od-ORHb-OEVmcd',
      '.VIpgJd-ZVi9od-ORHb',
      '.VIpgJd-ZVi9od-l4eHX-hSRGPd'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });
    });
    
    // Fix body position
    document.body.style.top = '0px';
    document.documentElement.style.top = '0px';
  };

  // Check if Google Translate is ready
  const checkTranslateReady = () => {
    return !!(
      window.google && 
      window.google.translate && 
      window.google.translate.TranslateElement
    );
  };

  const changeLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
    setIsOpen(false);
    
    // Different approach for mobile and desktop
    if (isTranslateReady) {
      try {
        // Method 1: Try to use Google Translate API directly
        const translateInstance = window.google.translate.TranslateElement.getInstance();
        if (translateInstance && typeof translateInstance.setLanguage === 'function') {
          translateInstance.setLanguage(lang.code);
          console.log(`Changed language to ${lang.name} using API`);
        } else {
          // Method 2: Use the select element approach as fallback
          const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (select) {
            select.value = lang.code;
            
            // Use a more compatible event triggering for mobile
            if (isMobile) {
              // For mobile browsers
              const event = document.createEvent('HTMLEvents');
              event.initEvent('change', true, false);
              select.dispatchEvent(event);
              
              // Touch event for mobile
              const touchEvent = document.createEvent('TouchEvent');
              touchEvent.initEvent('touchend', true, true);
              select.dispatchEvent(touchEvent);
            } else {
              // For desktop browsers
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            console.log(`Changed language to ${lang.name} using select element`);
          }
        }
      } catch (error) {
        console.error('Error changing language:', error);
        
        // Last resort: Try to directly use Google's translation approach
        try {
          // This accesses the internal structure directly - may break with Google updates
          const translateFrame = document.querySelector('.goog-te-menu-frame') as HTMLIFrameElement;
          if (translateFrame && translateFrame.contentDocument) {
            const items = translateFrame.contentDocument.querySelectorAll('.goog-te-menu2-item');
            items.forEach(item => {
              if (item.textContent?.includes(lang.name)) {
                (item as HTMLElement).click();
              }
            });
          }
        } catch (e) {
          console.error('Final fallback failed:', e);
        }
      }
    } else {
      console.warn('Google Translate not ready yet. Language change queued.');
      // Queue the language change for when translate is ready
      window.setTimeout(() => {
        if (checkTranslateReady()) {
          changeLanguage(lang);
        }
      }, 1000);
    }
    
    // Hide banner in all cases
    hideGoogleTranslateBanner();
    setTimeout(hideGoogleTranslateBanner, 300);
    setTimeout(hideGoogleTranslateBanner, 1000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // For mobile: handle touch events outside the dropdown
  useEffect(() => {
    const handleTouchOutside = (event: TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    if (isMobile) {
      document.addEventListener('touchend', handleTouchOutside);
    }
    
    return () => {
      if (isMobile) {
        document.removeEventListener('touchend', handleTouchOutside);
      }
    };
  }, [isMobile, isOpen]);

  // Check for Google Translate API availability
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (checkTranslateReady()) {
        setIsTranslateReady(true);
        clearInterval(checkInterval);
        
      }
    }, 500);
    
    // Clean up interval
    return () => clearInterval(checkInterval);
  }, []);

  // Initial setup to hide Google banner
  useEffect(() => {
    // Hide on component mount
    hideGoogleTranslateBanner();
    
    // Set up a MutationObserver to detect when Google Translate adds the banner to the DOM
    const observer = new MutationObserver(() => {
      hideGoogleTranslateBanner();
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Apply multiple times with different delays
    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(hideGoogleTranslateBanner, delay)
    );
    
    // Also set interval to periodically check and hide
    const intervalId = setInterval(hideGoogleTranslateBanner, 3000);
    
    // Clean up observer and timers on component unmount
    return () => {
      observer.disconnect();
      timeouts.forEach(clearTimeout);
      clearInterval(intervalId);
    };
  }, []);

  // Handle button click for both mobile and desktop
  const toggleDropdown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-[60%] notranslate" ref={dropdownRef}>
      {/* Custom dropdown button with improved event handling */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full px-3 py-2 text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-md shadow-sm transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>{selectedLanguage.name}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {/* Dropdown menu with conditional positioning */}
      {isOpen && (
        <div 
          className={`absolute z-50 w-full overflow-hidden backgroundMain border border-white/40 rounded-md shadow-lg
            ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}
        >
          <div className="max-h-full overflow-y-auto py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-teal-600/20
                  ${language.code === selectedLanguage.code ? 'bg-teal-600/30 text-white' : 'text-white/80'}`}
              >
                <span className="flex-grow">{language.name}</span>
                {language.code === selectedLanguage.code && (
                  <Check size={16} className="text-teal-300" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Hidden div for Google Translate to initialize in */}
      <div id="google_translate_element" className="hidden" aria-hidden="true"></div>
    </div>
  );
}
