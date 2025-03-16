import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { Search, Home, Telescope, Calendar, Handshake, Star, Languages, Contact, MessageSquare } from 'lucide-react';
import '../index.css';
import { LanguageSelector } from './LanguageSelector';

export function Footer() {
  const [currentYear] = useState(new Date().getFullYear());

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
    <footer className="backgroundMain border-t-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6]
 text-white/80 ">
      <div className="max-w-[100rem] space-y-6 mx-auto justify-between mt-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-between ">
          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] flex items-center gap-2">
                  <Home size={16} /> Home
                </Link>
              </li>
              <li>
                <Link to="/genres" className="text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] flex items-center gap-2">
                  <Telescope  size={16} /> Explore anime 
                </Link>
              </li>
              <li>
                <Link to="https://jikan.moe/" className="text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] flex items-center gap-2">
                  <Handshake size={16} />
                  Featuring Jikan API
                </Link>
              </li>
              <li>
                <Link to="https://appcrates.netlify.app" className="text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] flex items-center gap-2">
                  <Contact size={16} />
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div >
            <h3 className="text-lg font-semibold mb-4 text-white ">Quick Links</h3>
            <ul className="space-y-2">
              <li>
              <HashLink to="/#topAnime" className="text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] flex items-center gap-2">
                    <Star size={16} />
                    Top Anime
                </HashLink>
              </li>
              <li>
                <HashLink to="/#schedule" className="text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] flex items-center gap-2">
                  <Calendar size={16} />
                  Schedule
                </HashLink>
                </li>
                <li>
                <Link to="/forum" className="text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] flex items-center gap-2">
                  <MessageSquare size={16} />
                  Forum
                </Link>
              </li>
            </ul>
          </div>

          {/* Search */}
          <div >
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
                  className="flex items-center gap-2 text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6]"
                >
                  <Search size={16} />
                  Search Anime
                </button>
              </li>
            </ul>
          </div>

          {/* Language Selector */}
          
        </div>

        <div className="mt-12 flex  justify-center items-center  pt-8 border-t border-gray-800">
  <p className="notranslate text-sm text-center mx-auto px-4 sm:px-6 md:px-8 whitespace-normal">
    <span>&copy; {currentYear} Animeversum </span>
    <br />
    <span>by Arkadiusz Wawrzyniak.</span>
  </p>
</div>
      </div>
    </footer>
  );
}
