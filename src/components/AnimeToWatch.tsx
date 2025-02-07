import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Star, ChevronDown, X } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { Tooltip } from './ui/Tooltip';
import { saveNavigationState, getNavigationState } from '../utils/navigationState';
import { Pagination } from './Pagination';

// Cache for anime details
const animeCache: { [key: number]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const ITEMS_PER_PAGE = 10;
const BATCH_SIZE = 3;
const PLACEHOLDER_IMAGE = '/placeholder.jpg';

interface WatchlistAnime {
  id: number;
  anime_id: number;
  anime_title?: string;
  anime_image?: string;
  status?: 'planning' | 'watching' | 'completed' | 'dropped';
  genres?: { mal_id: number; name: string }[];
  isEnhanced?: boolean;
  created_at?: string;
}

interface Genre {
  mal_id: number;
  name: string;
}

const statusOptions = [
  { id: 'planning', label: 'Planning to Watch' },
  { id: 'watching', label: 'Currently Watching' },
  { id: 'completed', label: 'Completed' },
  { id: 'dropped', label: 'Dropped' }
] as const;

export function AnimeToWatch() {
  const { user, supabase } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [watchlist, setWatchlist] = useState<WatchlistAnime[]>([]);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams.get('statuses')?.split(',').filter(Boolean) || []
  );
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [loadedAnimeCount, setLoadedAnimeCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [openPlanDropdowns, setOpenPlanDropdowns] = useState<{ [key: number]: boolean }>({});
  const location = useLocation();

  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetchFromAPI('/genres/anime', {}, RequestPriority.LOW);
        if (response?.data) {
          setAllGenres(response.data);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };

    fetchGenres();
  }, []);

  // Enhance anime data with API details if needed
  const enhanceAnimeData = async (anime: WatchlistAnime) => {
    try {
      // Check if we already have the enhanced data
      if (anime.anime_title && anime.anime_image && anime.genres) {
        return {
          ...anime,
          isEnhanced: true
        };
      }

      // Fetch from API
      const animeData = await fetchFromAPI<any>(
        `/anime/${anime.anime_id}`,
        {},
        RequestPriority.LOW
      );

      if (!animeData?.data) {
        throw new Error('No data received from API');
      }

      // Update the database with the new information
      const { error: updateError } = await supabase
        .from('anime_watchlist')
        .update({
          anime_title: animeData.data.title,
          anime_image: animeData.data.images?.jpg?.image_url || null,
          genres: animeData.data.genres // Store genres in the database
        })
        .eq('anime_id', anime.anime_id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Return enhanced anime
      return {
        ...anime,
        anime_title: animeData.data.title,
        anime_image: animeData.data.images?.jpg?.image_url || PLACEHOLDER_IMAGE,
        genres: animeData.data.genres,
        isEnhanced: true
      };
    } catch (error) {
      console.error(`Error enhancing anime ${anime.anime_id}:`, error);
      return anime;
    }
  };

  // Load watchlist with progressive enhancement
  const fetchWatchlist = useCallback(async (page: number) => {
    if (!user || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      setError('');
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      
      // Fetch total count
      const { count } = await supabase
        .from('anime_watchlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setTotalItems(count || 0);

      // Fetch paginated watchlist
      const { data: watchlistData, error: watchlistError } = await supabase
        .from('anime_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (watchlistError) throw watchlistError;

      if (!watchlistData || watchlistData.length === 0) {
        setWatchlist([]);
        setIsLoading(false);
        return;
      }

      // Initialize watchlist with basic data
      const initialWatchlist = watchlistData.map(item => ({
        ...item,
        anime_image: item.anime_image || PLACEHOLDER_IMAGE,
        genres: item.genres || [],
        status: item.status || 'planning',
        isEnhanced: !!(item.anime_title && item.anime_image && item.genres?.length)
      }));

      setWatchlist(initialWatchlist);
      setIsLoading(false);

      // Find items that need enhancement
      const itemsToEnhance = initialWatchlist.filter(
        item => !item.anime_title || !item.anime_image || !item.genres?.length
      );

      if (itemsToEnhance.length > 0) {
        setIsLoadingMore(true);
        
        // Enhance in batches to respect API rate limits
        for (let i = 0; i < itemsToEnhance.length; i += BATCH_SIZE) {
          const batch = itemsToEnhance.slice(i, i + BATCH_SIZE);
          const enhancedBatch = await Promise.all(
            batch.map(item => enhanceAnimeData(item))
          );

          setWatchlist(prevWatchlist => {
            const newWatchlist = [...prevWatchlist];
            enhancedBatch.forEach(enhancedItem => {
              const index = newWatchlist.findIndex(w => w.anime_id === enhancedItem.anime_id);
              if (index !== -1) {
                newWatchlist[index] = enhancedItem;
              }
            });
            return newWatchlist;
          });

          setLoadedAnimeCount(prev => prev + batch.length);

          // Add delay between batches to respect rate limits
          if (i + BATCH_SIZE < itemsToEnhance.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        setIsLoadingMore(false);
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError('Failed to load watchlist');
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchWatchlist(currentPage);
  }, [currentPage, fetchWatchlist]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentPage !== 1) {
      params.set('page', currentPage.toString());
    } else {
      params.delete('page');
    }
    if (selectedStatuses.length > 0) {
      params.set('statuses', selectedStatuses.join(','));
    } else {
      params.delete('statuses');
    }
    if (selectedGenres.length > 0) {
      params.set('genres', selectedGenres.map(g => g.mal_id).join(','));
    } else {
      params.delete('genres');
    }
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  }, [currentPage, selectedStatuses, selectedGenres, searchTerm]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';
    
    setCurrentPage(page);
    setSelectedStatuses(statuses);
    setSearchTerm(search);
  }, [searchParams]);

  useEffect(() => {
    // Save navigation state when component mounts or filters change
    saveNavigationState({
      pathname: '/user/watchlist',
      search: '',
      filters: {
        selectedGenres,
        selectedStatuses,
        searchTerm,
        currentPage
      }
    });
  }, [selectedGenres, selectedStatuses, searchTerm, currentPage]);

  useEffect(() => {
    const savedState = getNavigationState();
    if (savedState?.source?.component === 'AnimeToWatch' && savedState?.page) {
      setCurrentPage(savedState.page);
    }
  }, []);

  useEffect(() => {
    if (currentPage > 0) {  // Only save if page is valid
      saveNavigationState({
        pathname: '/user/watchlist',
        search: '',
        page: currentPage,
        source: {
          component: 'AnimeToWatch'
        }
      });
    }
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setLoadedAnimeCount(0);
  };

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.plan-dropdown')) {
        setOpenPlanDropdowns({});
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setSelectedGenres([]);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setSelectedStatuses([]);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGenres = allGenres.filter(genre =>
    genre.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWatchlist = watchlist.filter(anime => {
    const matchesGenres = selectedGenres.length === 0 || 
      selectedGenres.every(selectedGenre =>
        anime.genres?.some(genre => genre.mal_id === selectedGenre.mal_id)
      );
    
    const matchesStatus = selectedStatuses.length === 0 ||
      selectedStatuses.includes(anime.status);

    return matchesGenres && matchesStatus;
  });

  const removeFromWatchlist = async (animeId: number) => {
    if (!user || !supabase) return;

    try {
      const { error } = await supabase
        .from('anime_watchlist')
        .delete()
        .eq('anime_id', animeId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWatchlist(prev => prev.filter(item => item.anime_id !== animeId));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to remove from watchlist');
    }
  };

  const updateAnimeStatus = async (animeId: number, newStatus: WatchlistAnime['status']) => {
    try {
      if (!user || !supabase) {
        return;
      }

      const { error } = await supabase
        .from('anime_watchlist')
        .update({ status: newStatus })
        .eq('anime_id', animeId)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      // Update local state
      setWatchlist(prev => prev.map(anime => 
        anime.anime_id === animeId 
          ? { ...anime, status: newStatus }
          : anime
      ));

    } catch (err) {
      setError('Failed to update status');
    }
  };

  // Check and update missing genre data
  const updateMissingGenreData = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      // Fetch all entries with missing or empty genre data
      const { data: watchlistData, error: fetchError } = await supabase
        .from('anime_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .or('genres.is.null,genres.eq.[]');  // Check for both null and empty arrays

      if (fetchError) throw fetchError;

      // Filter out entries that already have genres
      const missingGenreData = watchlistData?.filter(item => 
        !item.genres || 
        !Array.isArray(item.genres) || 
        item.genres.length === 0
      );

      if (!missingGenreData || missingGenreData.length === 0) {
        return;
      }

      // Update in batches to respect API rate limits
      for (let i = 0; i < missingGenreData.length; i += BATCH_SIZE) {
        const batch = missingGenreData.slice(i, i + BATCH_SIZE);
        
        await Promise.all(
          batch.map(async (item) => {
            try {
              const animeData = await fetchFromAPI<any>(
                `/anime/${item.anime_id}`,
                {},
                RequestPriority.LOW
              );

              if (!animeData?.data) {
                throw new Error('No data received from API');
              }

              // Ensure we have valid genre data before updating
              const genres = animeData.data.genres || [];
              if (genres.length === 0) {
                return;
              }

              const { error: updateError } = await supabase
                .from('anime_watchlist')
                .update({
                  anime_title: animeData.data.title,
                  anime_image: animeData.data.images?.jpg?.image_url || null,
                  genres: genres
                })
                .eq('anime_id', item.anime_id)
                .eq('user_id', user.id);

              if (updateError) throw updateError;
            } catch (error) {
              console.error(`Error updating genre data for anime ${item.anime_id}:`, error);
            }
          })
        );

        // Add delay between batches to respect rate limits
        if (i + BATCH_SIZE < missingGenreData.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Refresh the watchlist after updating
      fetchWatchlist(currentPage);
    } catch (error) {
      console.error('Error updating missing genre data:', error);
    }
  }, [user, supabase, currentPage, fetchWatchlist]);

  // Run the update check when component mounts
  useEffect(() => {
    updateMissingGenreData();
  }, [updateMissingGenreData]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your watchlist.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto  py-8 mt-12 px-4 md:px-12 lg:px-24 xl:px-48">
      <h1 className="text-3xl font-bold mb-8">My Watchlist</h1>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Status Filter Dropdown */}
          <div className="relative w-full md:w-auto z-50" ref={statusDropdownRef}>
            <button
              onClick={() => setSelectedStatuses([])}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
            >
              Filter by Status
              <ChevronDown className="w-4 h-4" />
            </button>

            {selectedStatuses.length > 0 && (
              <div className="absolute left-0 md:left-auto left-0 top-full mt-2 w-full md:w-64 bg-white border rounded-lg shadow-lg">
                {selectedStatuses.map((status) => (
                  <div
                    key={status}
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => {
                          if (selectedStatuses.includes(status)) {
                            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                          } else {
                            setSelectedStatuses([...selectedStatuses, status]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{statusOptions.find(opt => opt.id === status)?.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Genre Filter Dropdown */}
          <div className="relative w-full md:w-auto z-50" ref={genreDropdownRef}>
            <button
              onClick={() => setSelectedGenres([])}
              className="w-full z-50 md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-b-lg shadow-sm hover:bg-gray-50"
            >
              Filter by Genre
              <ChevronDown className="w-4 h-4" />
            </button>

            {selectedGenres.length > 0 && (
              <div className="absolute left-0 md:left-auto left-0 top-full mt-2 w-full md:w-64 bg-white border rounded-b-lg shadow-lg">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search genres..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto z-40">
                  {selectedGenres.map((genre) => (
                    <div
                      key={genre.mal_id}
                      className="px-4 py-2 hover:bg-gray-100"
                    >
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGenres.some(g => g.mal_id === genre.mal_id)}
                          onChange={() => {
                            if (selectedGenres.some(g => g.mal_id === genre.mal_id)) {
                              setSelectedGenres(selectedGenres.filter(g => g.mal_id !== genre.mal_id));
                            } else {
                              setSelectedGenres([...selectedGenres, genre]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{genre.name}</span>
                      </label>
                    </div>
                  ))}
                  {filteredGenres.map((genre) => (
                    <div
                      key={genre.mal_id}
                      className="px-4 py-2 hover:bg-gray-100"
                    >
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGenres.some(g => g.mal_id === genre.mal_id)}
                          onChange={() => {
                            if (selectedGenres.some(g => g.mal_id === genre.mal_id)) {
                              setSelectedGenres(selectedGenres.filter(g => g.mal_id !== genre.mal_id));
                            } else {
                              setSelectedGenres([...selectedGenres, genre]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{genre.name}</span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t flex justify-between">
                  <button
                    onClick={() => setSelectedGenres([])}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setSelectedGenres([])}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px] ">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : watchlist.length === 0 ? (
        <div className="text-center text-gray-500">
          Your watchlist is empty. Start adding some anime!
        </div>
      ) : filteredWatchlist.length === 0 ? (
        <div className="text-center text-gray-500">
          No anime found matching your filters
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredWatchlist.map((anime, index) => (
            <div key={anime.id} className="relative  shadow-lg rounded-lg aspect-[5/7]">
              <Link to={`/anime/${anime.anime_id}`} className="block  ">
                <div className="relative pt-[100%] rounded-lg">
                  <img
                    src={anime.anime_image}
                    alt={anime.anime_title}
                    className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://via.placeholder.com/225x318?text=No+Image';
                    }}
                  />
                </div>
                <div className="mt-1 ml-2">
                  <h3 className="text-lg font-semibold text-gray-900  hover:text-blue-600  line-clamp-2">
                    {anime.anime_title}
                  </h3>
                </div>
              </Link>
              {/*Plan Dropdown */}
              <div className="absolute bottom-0 w-full z-40 plan-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Close all other dropdowns first
                    setOpenPlanDropdowns(prev => {
                      const newState = {};
                      newState[anime.anime_id] = !prev[anime.anime_id];
                      return newState;
                    });
                  }}
                  className="w-full flex items-center justify-between px-2 bg-white border rounded-b-lg hover:bg-gray-50 text-sm"
                >
                  {statusOptions.find(opt => opt.id === anime.status)?.label || 'Planning to Watch'}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {openPlanDropdowns[anime.anime_id] && (
                  <div 
                    className="absolute left-0 top-full mt-2 w-full bg-white border rounded-lg shadow-lg"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {statusOptions.map((status) => (
                        <button
                          key={status.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            try {
                              await updateAnimeStatus(anime.anime_id, status.id as WatchlistAnime['status']);
                              setOpenPlanDropdowns({});
                            } catch (error) {
                              // Error is handled in updateAnimeStatus
                            }
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                            anime.status === status.id ? 'bg-gray-50 font-medium' : ''
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => removeFromWatchlist(anime.anime_id)}
                className="absolute top-2 right-2 bg-red-500 bg-opacity-70 hover:bg-opacity-100 text-white p-2 rounded-full transition-all duration-200"
                title="Remove from watchlist"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {totalItems > 0 && (
        <div className="flex justify-center mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
            onPageChange={handlePageChange}
            isLoading={isLoading || isLoadingMore}
          />
        </div>
      )}
    </div>
  );
}
