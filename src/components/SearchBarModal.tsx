import React, { useState, useEffect, useCallback, memo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, ChevronLeft, ChevronRight, Bookmark, Info } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from './LazyLoad';
import { useWatchlist } from '../hooks/useWatchlist';
import { useDebounce } from '../hooks/useDebounce';
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

// Memoized Result Card Component
const AnimeCard = memo(({ 
  anime, 
  onNavigate, 
  isInWatchlist, 
  onWatchlistToggle 
}: { 
  anime: SearchResult;
  onNavigate: (id: number) => void;
  isInWatchlist: boolean;
  onWatchlistToggle: (anime: SearchResult) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <LazyLoad>
      <div 
        className="relative bg-black/20 shadow-md rounded-lg overflow-hidden text-white ring-1 ring-white/40 cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={() => onNavigate(anime.mal_id)}
      >
        <div className="relative group">
          <div className={`w-full h-[220px] ${!imageLoaded ? 'bg-gray-700 animate-pulse' : ''}`}>
            <img
              src={anime.images.jpg.image_url}
              alt={anime.title}
              className={`w-full h-full object-cover  ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              decoding="async"
            />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 ">
            <div className="flex gap-2">
              <Tooltip content={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onWatchlistToggle(anime);
                  }}
                  className={`p-2.5 backdrop-blur-sm rounded-full shadow-lg border border-white/10 
                     ${isInWatchlist 
                    ? "bg-[#1A1C23]/90 hover:bg-[#EC4899]" 
                    : "bg-[#1A1C23]/90 hover:bg-[#6366F1]"}`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isInWatchlist ? "text-[#6366F1] fill-current" : "text-white"}`}
                  />
                </button>
              </Tooltip>
              <Tooltip content="More Info">
                <button
                  onClick={() => onNavigate(anime.mal_id)}
                  className="p-2.5 bg-[#1A1C23]/90 backdrop-blur-sm rounded-full shadow-lg border border-white/10 
                    hover:bg-[#6366F1] "
                >
                  <Info className="w-4 h-4 text-white" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold truncate">{anime.title}</h3>
        </div>
      </div>
    </LazyLoad>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.anime.mal_id === nextProps.anime.mal_id &&
    prevProps.isInWatchlist === nextProps.isInWatchlist
  );
});

AnimeCard.displayName = 'AnimeCard';

// Memoized Pagination Component
const Pagination = memo(({ 
  currentPage, 
  pagination, 
  onPageChange 
}: { 
  currentPage: number;
  pagination: PaginationData;
  onPageChange: (page: number) => void;
}) => (
  <div className="border-t py-3 px-6 flex items-center justify-between text-white">
    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
      <ChevronLeft />
    </button>
    <span>Page {currentPage} of {pagination.last_visible_page}</span>
    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= pagination.last_visible_page}>
      <ChevronRight />
    </button>
  </div>
));

Pagination.displayName = 'Pagination';

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

  // Memoized handlers
  const handleSearch = useCallback(async (page: number = 1) => {
    if (!searchQuery.trim()) return;

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
    setSearchResults([]);

    try {
      const response = await fetchFromAPI<any>('/anime', {
        q: searchQuery,
        page: page.toString(),
        limit: '12',
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
  }, [searchQuery, showTvSeries, showMovies, searchParams, setSearchParams]);

  const handleFilterChange = useCallback((type: 'tv' | 'movie', checked: boolean) => {
    if (type === 'tv') {
      setShowTvSeries(checked);
    } else {
      setShowMovies(checked);
    }
  }, []);

  const handleSearchClick = useCallback(() => {
    if (searchQuery.trim()) {
      handleSearch(1);
    }
  }, [handleSearch, searchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch(1);
    }
  }, [handleSearch, searchQuery]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.last_visible_page)) return;
    setCurrentPage(newPage);
    handleSearch(newPage);
  }, [pagination, handleSearch]);

  const handleWatchlistToggle = useCallback((anime: SearchResult) => {
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
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  const handleNavigate = useCallback((id: number) => {
    navigate(`/anime/${id}`);
  }, [navigate]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentPage(1);
    setTotalResults(0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && searchParams.get('q')) {
      handleSearch(currentPage).then(() => {
        if (!isMounted) return;
      });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);
  return (
    <React.Fragment>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] touch-none"
          onClick={onClose}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60" />
          
          {/* Modal Content */}
          <div className="fixed inset-0 sm:inset-4 md:inset-8 flex items-center justify-center p-4">
            <div className="w-[95%] md:w-4/5 max-w-5xl h-4/5 mx-auto rounded-lg shadow-lg flex flex-col backgroundMain ring-1 ring-white/80"
                 onClick={(e) => e.stopPropagation()}
                 onTouchStart={(e) => e.stopPropagation()}
                 onTouchMove={(e) => e.stopPropagation()}
                 onTouchEnd={(e) => e.stopPropagation()}
            >
              <button 
                className="p-2 hover:bg-red-300 rounded-full flex-shrink self-end mr-6 mt-4 text-white" 
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>

              <div className="p-6 border-b flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search anime..."
                      className="w-full px-4 py-2 bg-white/20 placeholder:text-white text-white border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white transition-colors duration-200"
                        aria-label="Clear search"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearchClick}
                    disabled={!searchQuery.trim()}
                    className="px-4 py-2 cyberpunk-neon-btn blue"
                  >
                    <Search className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={showTvSeries}
                      onChange={(e) => handleFilterChange('tv', e.target.checked)}
                      className="hidden"
                    />
                    <span className="checkbox-custom rounded text-white"></span>
                    <span className="ml-2 text-white">TV Series</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={showMovies}
                      onChange={(e) => handleFilterChange('movie', e.target.checked)}
                      className="hidden"
                    />
                    <span className="checkbox-custom rounded text-white"></span>
                    <span className="ml-2 text-white">Movies</span>
                  </label>
                </div>
              </div>
              {/* results */}
              <div className="flex-1 overflow-auto px-1 md:px-6 py-4">
                {isLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-600 text-center py-4">{error}</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <p className="text-white mb-4">{totalResults.toLocaleString()} results found</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-white">
                      {searchResults.map((anime) => (
                        <AnimeCard
                          key={anime.mal_id}
                          anime={anime}
                          onNavigate={handleNavigate}
                          isInWatchlist={!!isInWatchlist[anime.mal_id]}
                          onWatchlistToggle={handleWatchlistToggle}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white py-6">No results found.</div>
                )}
              </div>

              {pagination && (
                <Pagination
                  currentPage={currentPage}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}