import React, { useEffect } from 'react';

interface Language {
  code: string;
  name: string;
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

export function LanguageSelector() {
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

  const changeLanguage = (lang: string) => {
    // Set Google Translate language
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang;
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
    <select
      onChange={(e) => changeLanguage(e.target.value)}
      className="block w-[40%] px-3 py-2 text-base text-black bg-white/30 backdrop-blur-sm border border-gray-300 rounded-md shadow-sm 
      focus:outline-none focus:ring-blue-500 focus:border-blue-500 notranslate"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
