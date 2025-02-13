import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, ChevronLeft, ChevronRight, Bookmark, Info } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from './LazyLoad';
import { useWatchlist } from '../hooks/useWatchlist';
import { Tooltip } from './ui/Tooltip';

interface SearchResult {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string } };
  score: number;
  type: string;
  episodes: number;
}

interface PaginationData {
  current_page: number;
  has_next_page: boolean;
  last_visible_page: number;
}

interface SearchBarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBarModal({ isOpen, onClose }: SearchBarModalProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [showTvSeries, setShowTvSeries] = useState(searchParams.get('type')?.includes('tv') ?? true);
  const [showMovies, setShowMovies] = useState(searchParams.get('type')?.includes('movie') ?? true);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  useEffect(() => {
    // Only perform search when modal is opened with existing query
    if (isOpen && searchParams.get('q')) {
      handleSearch(currentPage);
    }
  }, [isOpen]); // Only depend on isOpen

  const handleSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) return;
    
    // Update search params first
    const params = new URLSearchParams(searchParams);
    params.set('q', searchQuery);
    params.set('page', page.toString());
    
    const types = [];
    if (showTvSeries) types.push('tv');
    if (showMovies) types.push('movie');
    if (types.length === 1) {
      params.set('type', types[0]);
    } else {
      params.delete('type');
    }
    setSearchParams(params);

    setIsLoading(true);
    setError(null);
    setSearchResults([]); // Clear previous results immediately

    try {
      const response = await fetchFromAPI<any>('/anime', {
        q: searchQuery,
        page: page.toString(),
        limit: '18',
        sfw: 'true',
        ...(types.length === 1 && { type: types[0] })
      });

      if (response?.data) {
        setSearchResults(response.data);
        setPagination(response.pagination);
        setTotalResults(response.pagination.items.total);
      } else {
        setError('No results found.');
        setSearchResults([]);
        setTotalResults(0);
      }
    } catch (error) {
      setError('Failed to perform search.');
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.last_visible_page)) return;
    setCurrentPage(newPage);
    handleSearch(newPage);
  };

  const handleFilterChange = (type: 'tv' | 'movie', checked: boolean) => {
    if (type === 'tv') {
      setShowTvSeries(checked);
    } else {
      setShowMovies(checked);
    }
    // Perform new search with updated filters
    handleSearch(1);
  };

  return (
    <>
      {isOpen && (
        <div className="absolute inset-0 w-screen h-screen flex items-center justify-center bg-black bg-opacity-50 z-50">
          {/* MODAL CONTAINER */}
          <div className="bg-white w-4/5 max-w-4xl h-4/5 mx-auto rounded-lg shadow-lg flex flex-col modalOpen">
            {/* CLOSE BUTTON */}
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink self-end mr-6 mt-4" onClick={onClose}>
              <X className="h-6 w-6" />
            </button>
            {/* HEADER */}
            <div className="p-6 border-b flex flex-col gap-4">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                  placeholder="Search anime..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSearch(1)}
                  disabled={!searchQuery.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* FILTERS */}
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showTvSeries}
                    onChange={(e) => handleFilterChange('tv', e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">TV Series</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showMovies}
                    onChange={(e) => handleFilterChange('movie', e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Movies</span>
                </label>
              </div>
            </div>

            {/* SEARCH RESULTS */}
            <div className="flex-1 overflow-auto p-6">
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 text-center py-4">{error}</div>
              ) : searchResults.length > 0 ? (
                <div>
                  <p className="text-gray-600 mb-4">{totalResults.toLocaleString()} results found</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {searchResults.map((anime) => (
                      <LazyLoad key={anime.mal_id}>
                        <div className="relative bg-gray-50 shadow-md rounded-lg overflow-hidden">
                          {/* IMAGE CONTAINER WITH BUTTONS */}
                          <div className="relative">
                            <img
                              src={anime.images.jpg.image_url}
                              alt={anime.title}
                              className="w-full h-[220px] object-cover"
                            />
                            {/* BUTTONS POSITIONED ABSOLUTELY ON THE IMAGE */}
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Tooltip content={isInWatchlist[anime.mal_id] ? "Remove from Watchlist" : "Add to Watchlist"}>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isInWatchlist[anime.mal_id]) {
                                      removeFromWatchlist(anime.mal_id);
                                    } else {
                                      addToWatchlist({
                                        mal_id: anime.mal_id,
                                        title: anime.title,
                                        images: {
                                          jpg: {
                                            image_url: anime.images.jpg.image_url
                                          }
                                        }
                                      });
                                    }
                                  }}
                                  className="p-2 bg-black rounded-full shadow-md hover:bg-opacity-80 transition-opacity"
                                >
                                  <Bookmark
                                    className={`w-4 h-4 ${
                                      isInWatchlist[anime.mal_id] ? "text-blue-500 fill-current" : "text-white"
                                    }`}
                                  />
                                </button>
                              </Tooltip>

                              <Tooltip content="More Info">
                                <button
                                  onClick={() => navigate(`/anime/${anime.mal_id}`)}
                                  className="p-2 bg-black rounded-full shadow-md hover:bg-opacity-80 transition-opacity"
                                >
                                  <Info className="w-4 h-4 text-white" />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          {/* TITLE */}
                          <div className="p-3">
                            <h3 className="text-sm font-semibold truncate">{anime.title}</h3>
                          </div>
                        </div>
                      </LazyLoad>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">No results found.</div>
              )}
            </div>

            {/* PAGINATION */}
            {pagination && (
              <div className="border-t py-3 px-6 flex items-center justify-between">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft />
                </button>
                <span>Page {currentPage} of {pagination.last_visible_page}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pagination.last_visible_page}>
                  <ChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}