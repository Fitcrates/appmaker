import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, List, Calendar, Github, Star, Globe } from 'lucide-react';
import '../index.css';
import { LanguageSelector } from './LanguageSelector';

const languages = [
  { code: '', name: 'Original' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
];

export function Footer() {
  const [selectedLanguage, setSelectedLanguage] = useState('');

  const changeLanguage = (languageCode: string) => {
    const googleTranslateSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (googleTranslateSelect) {
      googleTranslateSelect.value = languageCode;
      googleTranslateSelect.dispatchEvent(new Event('change'));
    }
    setSelectedLanguage(languageCode);
  };

  useEffect(() => {
    // Try to get the current language from Google Translate
    const googleTranslateSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (googleTranslateSelect) {
      setSelectedLanguage(googleTranslateSelect.value);
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  function resetTranslation() {
    // Clear Google Translate cookies/local storage to remove saved language preference
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    localStorage.removeItem("googtrans");
  
    // Try to trigger Google Translate reset
    const iframe = document.querySelector('iframe.goog-te-banner-frame');
    if (iframe) {
      const resetButton = iframe.contentDocument?.querySelector('button'); 
      if (resetButton) {
        resetButton.click();
      }
    }
  
    // Reload the page to ensure the original language is set
    window.location.reload();
  }

  return (
    <footer className="bg-gray-900 text-gray-300 ">
      <div className="container mx-auto  py-8 ml-24 px-12 lg:px-24 justify-evenly">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ">
          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <Home size={16} /> Home
                </Link>
              </li>
              <li>
                <Link to="/genres" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <List size={16} /> Explore anime 
                </Link>
              </li>
              
              <li>
                <Link to="/forum" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <List size={16} />
                  Forum
                </Link>
              </li>
              <li>
                <Link to="https://docs.api.jikan.moe/" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <List size={16} />
                  Featuring Jikan API
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <Star size={16} />
                  Top Anime
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <Calendar size={16} />
                  Schedule
                </Link>
              </li>
            </ul>
          </div>

          {/* Search */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Search</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    const searchButton = document.querySelector('[aria-label="Search"]');
                    if (searchButton instanceof HTMLElement) {
                      searchButton.click();
                    }
                  }}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Search size={16} />
                  Search Anime
                </button>
              </li>
            </ul>
          </div>

          {/* Language Selector */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Globe size={20} /> Language
            </h3>
            <div className="space-y-2">
              <div id="google_translate_element" className="hidden"></div>
              <div>
                <LanguageSelector />
              </div>
              <button 
                onClick={resetTranslation}
                className="mt-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors w-[40%]"
              >
                Reset to Original
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          <p className="notranslate">&copy; {new Date().getFullYear()} Anime Search by Arkadiusz Wawrzyniak. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
