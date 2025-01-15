import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from './LazyLoad';
import { Modal } from './Modal';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

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

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-xl font-bold text-blue-600">
              Anime Search
            </Link>
            <Link to="/genre" className="text-gray-600 hover:text-gray-900">
              Explore anime by genre
            </Link>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-gray-600 hover:transform hover:scale-105 focus:outline-none"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

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
                        <Link
                          to={`/anime/${anime.mal_id}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-[3/4] relative">
                            <img
                              src={anime.images.jpg.image_url}
                              alt={anime.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-sm line-clamp-2">{anime.title}</h3>
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span>{anime.score || 'N/A'}</span>
                            </div>
                          </div>
                        </Link>
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
