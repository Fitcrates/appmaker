import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

// Define language interface
interface Language {
  code: string;
  name: string;
}

// Available languages - these should match the languages in googleTranslateElementInit
const languages: Language[] = [
  { code: '', name: 'Original' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh-CN', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'pl', name: 'Polski' }
];

// Language selector component
export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize selected language from cookie on mount
  useEffect(() => {
    try {
      // Check for Google Translate cookie
      const match = document.cookie.match(/googtrans=\/[^\/]*\/([^;]*)/);
      const langCode = match ? match[1] : '';
      
      if (langCode) {
        const lang = languages.find(l => l.code === langCode);
        if (lang) {
          setSelectedLanguage(lang);
        }
      }
    } catch (error) {
      console.warn('Error getting translation cookie:', error);
    }
  }, []);

  // Function to change the language using Google Translate
  const changeLanguage = (lang: Language) => {
    try {
      // Update selected language state
      setSelectedLanguage(lang);
      setIsOpen(false);
      
      // Get Google Translate object
      const googleTranslateElement = document.getElementById('google_translate_element');
      if (!googleTranslateElement) {
        console.warn('Google Translate element not found');
        return;
      }
      
      // Find and click the appropriate language option
      const selectElement = googleTranslateElement.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = lang.code;
        selectElement.dispatchEvent(new Event('change'));
      } else {
        // For newer versions of Google Translate
        const iframe = document.querySelector('iframe.goog-te-menu-frame') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          const items = iframe.contentDocument.querySelectorAll('.goog-te-menu2-item');
          items.forEach(item => {
            if (item.textContent?.includes(lang.name)) {
              (item as HTMLElement).click();
            }
          });
        } else {
          // If we can't find the elements, try setting cookies directly
          document.cookie = `googtrans=/auto/${lang.code || 'auto'}`;
          window.location.reload();
        }
      }
      
      // Hide Google Translate elements
      if (window.translateDebug?.hideGoogleTranslateBanner) {
        setTimeout(window.translateDebug.hideGoogleTranslateBanner, 100);
      }
    } catch (error) {
      console.warn('Error changing language:', error);
    }
  };

  // Handle button click
  const toggleDropdown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="language-selector relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="language-selector-button flex items-center text-white hover:text-[#4ef1d6] transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{selectedLanguage.name || 'Language'}</span>
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="language-selector-dropdown absolute z-50 mt-1 w-48 rounded-md bg-[#1a1a2e] shadow-lg border border-[#2a2a42]">
          <div className="py-1 max-h-60 overflow-auto">
            {languages.map((lang) => (
              <button
                key={lang.code || 'original'}
                onClick={() => changeLanguage(lang)}
                className={`language-option w-full text-left px-4 py-2 text-sm notranslate ${
                  selectedLanguage.code === lang.code
                    ? 'bg-[#4ef1d6] text-[#1a1a2e]'
                    : 'text-white hover:bg-[#2a2a42]'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add this to make TypeScript recognize the window.translateDebug property
declare global {
  interface Window {
    translateDebug?: {
      hideGoogleTranslateBanner: () => void;
      isTranslateReady: boolean;
    };
  }
}
