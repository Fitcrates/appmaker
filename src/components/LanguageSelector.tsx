import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Language {
  code: string;
  name: string;
}

interface LanguageSelectorProps {
  position?: 'navbar' | 'footer'; // Default will be 'navbar'
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
    
    // Also apply via CSS for redundancy
    if (!document.getElementById('google-translate-banner-css')) {
      const style = document.createElement('style');
      style.id = 'google-translate-banner-css';
      style.innerHTML = `
        .goog-te-banner-frame,
        iframe.goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        .VIpgJd-ZVi9od-ORHb-OEVmcd,
        .VIpgJd-ZVi9od-ORHb,
        .VIpgJd-ZVi9od-l4eHX-hSRGPd {
          display: none !important;
        }
        body {
          top: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  const changeLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
    setIsOpen(false);
    
    // Set Google Translate language
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang.code;
      select.dispatchEvent(new Event('change'));
      
      // Hide banner immediately and then again after a delay
      hideGoogleTranslateBanner();
      
      // Apply multiple times with different delays to catch the banner whenever it appears
      setTimeout(hideGoogleTranslateBanner, 100);
      setTimeout(hideGoogleTranslateBanner, 300);
      setTimeout(hideGoogleTranslateBanner, 500);
      setTimeout(hideGoogleTranslateBanner, 1000);
    }
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
    
    // Apply multiple times with different delays to catch the banner whenever it appears
    setTimeout(hideGoogleTranslateBanner, 100);
    setTimeout(hideGoogleTranslateBanner, 500);
    setTimeout(hideGoogleTranslateBanner, 1000);
    
    // Also set interval to periodically check and hide
    const intervalId = setInterval(hideGoogleTranslateBanner, 2000);
    
    // Clean up observer and interval on component unmount
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="relative w-[60%] notranslate" ref={dropdownRef}>
      {/* Custom dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
      
      {/* Hidden select element to work with Google Translate */}
      <select 
        className="hidden goog-te-combo" 
        aria-hidden="true"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
