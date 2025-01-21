import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search, Star, ChevronLeft, ChevronRight, Info, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { Modal } from './Modal';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from './LazyLoad';
import { useWatchlist } from '../hooks/useWatchlist';
import { Tooltip } from './ui/Tooltip';

interface SearchResult {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  score: number;
}

interface PaginationData {
  current_page: number;
  has_next_page: boolean;
  items: { count: number; total: number; per_page: number };
  last_visible_page: number;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const { user, signOut } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsOpen(false); // Close mobile menu if open
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFromAPI<any>('/anime', {
        q: searchQuery,
        page: page.toString(),
        limit: '20',
        sfw: 'true'
      });

      if (response?.data) {
        setSearchResults(response.data);
        setPagination(response.pagination);
      } else {
        setError('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    handleSearch(newPage);
  };

  const handleWatchlistClick = async (anime: SearchResult) => {
    try {
      if (isInWatchlist[anime.mal_id]) {
        await removeFromWatchlist(anime.mal_id);
      } else {
        await addToWatchlist({
          mal_id: anime.mal_id,
          title: anime.title,
          images: {
            jpg: {
              image_url: anime.images.jpg.image_url
            }
          }
        });
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">
                AnimeCrates
              </Link>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:ml-6">
            <div className="flex space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link to="/genres" className="text-gray-600 hover:text-gray-900">
                Explore anime by genre
              </Link>
              {user && (
                <Link
                  to="/watchlist"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Watchlist
                </Link>
              )}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-600 hover:transform hover:scale-105 focus:outline-none"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            {user ? (
              <div className="ml-4 flex items-center space-x-4">
                <span className="text-gray-700">{user.user_metadata.name || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              to="/genres"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Explore anime by genre
            </Link>
            {user && (
              <Link
                to="/watchlist"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                My Watchlist
              </Link>
            )}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            {user ? (
              <>
                <span className="block px-3 py-2 text-base font-medium text-gray-700">
                  {user.user_metadata.name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <Modal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
          setSearchResults([]);
          setCurrentPage(1);
          setPagination(null);
          setError(null);
        }}
        title="Search Anime"
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setCurrentPage(1);
                          handleSearch(1);
                        }
                      }}
                      placeholder="Search anime by name..."
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          setPagination(null);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    handleSearch(1);
                  }}
                  disabled={!searchQuery.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4">
            <div className="max-w-7xl mx-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 text-center py-4">{error}</div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
                    {searchResults.map((anime, index) => (
                      <LazyLoad key={`${anime.mal_id}-${index}`}>
                        <div className="relative group">
                          <img
                            src={anime.images.jpg.image_url}
                            alt={anime.title}
                            className="w-full h-[300px] object-cover rounded-lg"
                          />

                          {/* Overlay with buttons */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                            {/* Watchlist Button */}
                            <Tooltip content="Save to watchlist">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleWatchlistClick(anime);
                                }}
                                className={`p-2 rounded-full ${
                                  isInWatchlist[anime.mal_id]
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-white text-gray-800 hover:bg-gray-100'
                                } transition-colors duration-300`}
                              >
                                <Bookmark className="w-6 h-6" />
                              </button>
                            </Tooltip>

                            {/* Info Button */}
                            <Tooltip content="Information">
                              <button
                                onClick={(e) => e.preventDefault()}
                                className="p-2 rounded-full bg-white text-gray-800 hover:bg-gray-100 transition-colors duration-300"
                              >
                                <Link 
                                  to={`/anime/${anime.mal_id}`}
                                  onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                  }}
                                >
                                  <Info className="w-6 h-6" />
                                </Link>
                              </button>
                            </Tooltip>
                          </div>

                          <Link
                            to={`/anime/${anime.mal_id}`}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="block mt-2"
                          >
                            <h3 className="font-semibold text-lg line-clamp-1">{anime.title}</h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span>{anime.score || 'N/A'}</span>
                            </div>
                          </Link>
                        </div>
                      </LazyLoad>
                    ))}
                  </div>

                  {pagination && (
                    <div className="sticky bottom-0 bg-white border-t py-3 px-6 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} of {pagination.last_visible_page}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.has_next_page}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>
    </nav>
  );
}
