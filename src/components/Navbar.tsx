import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Star, Info, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { SearchBarModal } from './SearchBarModal';
import { useWatchlist } from '../hooks/useWatchlist';
import { LanguageSelector } from './LanguageSelector';

// Ensure the Navbar component is exported as the default export
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { isInWatchlist } = useWatchlist();
  const location = useLocation();
  const navigate = useNavigate();

  const resetTranslation = () => {
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
  };

  // Memoize the username to prevent unnecessary re-renders
  const username = useMemo(() => {
    if (!user) return '';
    return user.user_metadata?.custom_name || '';
  }, [user?.user_metadata?.custom_name]);

  // Check for search modal state and route
  useEffect(() => {
    const isAnimeDetailsPage = location.pathname.startsWith('/anime/');
    
    if (isAnimeDetailsPage) {
      // Hide modal on details page
      setIsSearchOpen(false);
    } else if (location.state?.openSearchModal || location.search.includes('q=')) {
      // Show modal when returning from details or has search params
      setIsSearchOpen(true);
    }
  }, [location.pathname, location.search, location.state]);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsOpen(false); // Close mobile menu if open
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return ( 
    <nav className="fixed w-full  shadow-lg z-[999] top-0 bg-[#2f0468] border-b border-b-[#43b5a0] backdrop-blur-sm">
      <div className="max-w-[100rem] space-y-6 mx-auto justify-center  px-4 sm:px-6 lg:px-8 ">
        <div className="flex justify-between h-16 min-h-[64px] ">
          <div className="flex items-center">
            {/* Desktop navigation */}
            <div className="flex-shrink-0 flex items-center mr-4 ">
              <Link to="/" className="bg-clip-text text-[#f4ff54] drop-shadow-[0_0_8px_#f4ff54] tilt-neon3  leading-tight notranslate">
                AnimeCrates
              </Link>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-4">
              <button
                onClick={() => {
                  if (location.pathname.includes('/anime/')) {
                    navigate('/', { state: { openSearchModal: true } });
                  } else {
                    setIsSearchOpen(true);
                  }
                }}
                className="text-white hover:bg-[#fec859] hover:text-black  p-2 rounded-lg"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                to="/"
                className="text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] px-3 py-2 rounded-md text-sm font-medium notranslate"
              >
                Home
              </Link>
              <Link
                to="/genres"
                className="text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] px-3 py-2 rounded-md text-sm font-medium"
              >
                Explore anime
              </Link>
              <Link
                to="/forum"
                className="text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] px-3 py-2 rounded-md text-sm font-medium"
              >
                Forum
              </Link>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="h-8 flex items-center border-r border-gray-200 pr-4 mr-2">
              <LanguageSelector />
              <button 
                onClick={resetTranslation} 
                className="ml-2 px-3 py-1 text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6]"
              >
                Reset to Original
              </button>
            </div>
            <div className="min-w-[160px] flex items-center justify-end transition-opacity duration-200">
              {loading ? (
                <div className="h-6 w-24  bg-[#331a38]/85 border border-b-[#43b5a0] backdrop-blur-sm rounded animate-pulse"></div>
              ) : user ? (
                <div className="relative group z-50">
                  <button className="flex items-center text-white hover:text-[#fec859] pb-2">
                    <span className="mr-1 min-w-[120px] text-right truncate notranslate">
                      {username}
                    </span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 ring-1 ring-white/40 w-48 backgroundMain   rounded-md shadow-lg py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 ease-in-out">
                    <div className="relative -top-2 left-0 right-0 h-2 bg-transparent"></div>
                    <Link to="/user/ratings" className="block px-4 py-2 text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6]">
                      My Ratings
                    </Link>
                    <Link to="/user/watchlist" className="block px-4 py-2 text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6]">
                      To Watch List
                    </Link>
                    <Link to="/user/settings" className="block px-4 py-2 text-sm text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6]">
                      Account Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="bblock px-4 py-2 text-sm text-white hover:bg-clip-text hover:text-[#bd4c4c] hover:drop-shadow-[0_0_8px_#bd4c4c]"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-sm text-white hover:bg-clip-text hover:text-[#fec859] hover:drop-shadow-[0_0_8px_#fec859]"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white fixed inset-0 z-[9999] ">
        <div className="px-4 py-6 backgroundMain">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md text-white hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              {loading ? (
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mb-4"></div>
              ) : user ? (
                <div className="pb-4">
                  <span className="text-base font-medium text-white min-w-[120px] truncate inline-block">
                    {username}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center w-full px-4 py-2 text-base font-medium text-white hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Language section */}
            <div className="py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-white mb-3 px-4">Language</h3>
              <div className="px-4">
                <div className="w-full">
                  <div id="google_translate_element" className="hidden"></div>
                  <LanguageSelector />
                </div>
                <button 
                  onClick={resetTranslation} 
                  className="mt-2 w-full text-left py-2 text-sm text-white hover:text-black hover:bg-[#4ef1d6] rounded transition-colors"
                >
                  Reset to Original
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex items-center px-4 py-2 text-base font-medium text-white hover:bg-[#4ef1d6] hover:text-black rounded-lg"
              >
                <Search className="h-5 w-5 mr-3" />
                <span>Search</span>
              </button>

              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-base font-medium text-white hover:bg-[#4ef1d6] hover:text-black rounded-lg"
              >
                Home
              </Link>

              <Link
                to="/genres"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-base font-medium text-white hover:bg-[#4ef1d6] hover:text-black rounded-lg"
              >
                Explore anime
              </Link>

              <Link
                to="/forum"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-base font-medium text-white hover:bg-[#4ef1d6] hover:text-black rounded-lg"
              >
                Forum
              </Link>
            </div>

            {user ? (
              <>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Link
                    to="/user/watchlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-2 text-base font-medium text-white hover:bg-[#4ef1d6] hover:text-black rounded-lg"
                  >
                    <Bookmark className="h-5 w-5 mr-3" />
                    My Watchlist
                  </Link>

                  <Link
                    to="/user/ratings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-2 text-base font-medium text-white hover:bg-[#4ef1d6] hover:text-black rounded-lg"
                  >
                    <Star className="h-5 w-5 mr-3" />
                    My Ratings
                  </Link>

                  <Link
                    to="/user/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-2 text-base font-medium text-white hover:bg-[#4ef1d6] hover:text-black rounded-lg"
                  >
                    <Info className="h-5 w-5 mr-3" />
                    Account Settings
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md mt-2"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center w-full px-4 py-2 text-base font-medium text-[#4ef1d6] hover:text-black hover:bg-[#4ef1d6] rounded-md"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <SearchBarModal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
        }}
      />
    </nav>
    
  );
}
