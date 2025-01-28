import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Star, ChevronDown, X } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { fetchFromAPI, fetchAnimeData, fetchAnimeGenres } from '../utils/api';
import { Tooltip } from './ui/Tooltip';

interface WatchlistAnime {
  id: number;
  anime_id: number;
  anime_title: string;
  anime_image: string;
  status?: 'planning' | 'watching' | 'completed' | 'dropped';
  genres?: { mal_id: number; name: string }[];
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
  const [watchlist, setWatchlist] = useState<WatchlistAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<typeof statusOptions[number]['id'][]>([]);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [loadedAnimeCount, setLoadedAnimeCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const BATCH_SIZE = 3;

  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setIsGenreDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch genres
  const fetchGenres = async () => {
    try {
      const genres = await fetchAnimeGenres();
      setAllGenres(genres);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchWatchlist = async () => {
      if (!user || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        const { data: watchlistData, error: watchlistError } = await supabase
          .from('anime_watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (watchlistError) throw watchlistError;

        // Ensure we have all required fields
        const validWatchlistData = (watchlistData || []).filter(item => 
          item.anime_id && item.anime_title && item.anime_image
        );

        if (!isMounted) return;
        console.log('Watchlist data:', validWatchlistData);

        // Initialize watchlist with basic data
        setWatchlist(validWatchlistData.map(anime => ({
          ...anime,
          genres: [] // Will be populated progressively
        })));
        
        // Load details in batches
        const loadBatch = async (startIndex: number) => {
          if (!isMounted) return;
          if (startIndex >= validWatchlistData.length) {
            setIsLoadingMore(false);
            return;
          }

          setIsLoadingMore(true);
          const endIndex = Math.min(startIndex + BATCH_SIZE, validWatchlistData.length);
          const currentBatch = validWatchlistData.slice(startIndex, endIndex);

          const batchWithGenres = await Promise.all(
            currentBatch.map(async (anime) => {
              try {
                const animeData = await fetchAnimeData(anime.anime_id);
                return {
                  ...anime,
                  genres: animeData?.genres || []
                };
              } catch (err) {
                console.error(`Error fetching genres for anime ${anime.anime_id}:`, err);
                return anime;
              }
            })
          );

          if (!isMounted) return;

          setWatchlist(prevWatchlist => {
            const newWatchlist = [...prevWatchlist];
            batchWithGenres.forEach((animeWithGenres, index) => {
              newWatchlist[startIndex + index] = animeWithGenres;
            });
            return newWatchlist;
          });

          setLoadedAnimeCount(endIndex);
          
          // Load next batch
          if (endIndex < validWatchlistData.length) {
            setTimeout(() => loadBatch(endIndex), 100); // Small delay between batches
          } else {
            setIsLoadingMore(false);
          }
        };

        // Start loading the first batch
        loadBatch(0);
        setIsLoading(false);

      } catch (err) {
        console.error('Error fetching watchlist:', err);
        if (isMounted) {
          setError('Failed to load watchlist');
          setIsLoading(false);
        }
      }
    };

    fetchWatchlist();

    return () => {
      isMounted = false;
    };
  }, [user?.id, supabase]);

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
      const { error } = await supabase
        .from('anime_watchlist')
        .update({ status: newStatus })
        .eq('id', animeId);

      if (error) throw error;

      setWatchlist(watchlist.map(anime => 
        anime.id === animeId ? { ...anime, status: newStatus } : anime
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Watchlist</h1>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Status Filter Dropdown */}
          <div className="relative w-full md:w-auto z-50" ref={statusDropdownRef}>
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
            >
              Filter by Status
              <ChevronDown className="w-4 h-4" />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute left-0 md:left-auto right-0 top-full mt-2 w-full md:w-64 bg-white border rounded-lg shadow-lg">
                {selectedStatuses.length > 0 && (
                  <div className="px-2 py-2 border-b flex flex-wrap gap-1">
                    {selectedStatuses.map((status) => (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {statusOptions.find(opt => opt.id === status)?.label}
                        <button
                          onClick={() => setSelectedStatuses(selectedStatuses.filter(s => s !== status))}
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto">
                  {statusOptions.map((status) => (
                    <div
                      key={status.id}
                      className="px-4 py-2 hover:bg-gray-100"
                    >
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status.id)}
                          onChange={() => {
                            if (selectedStatuses.includes(status.id)) {
                              setSelectedStatuses(selectedStatuses.filter(s => s !== status.id));
                            } else {
                              setSelectedStatuses([...selectedStatuses, status.id]);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{status.label}</span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="p-2 border-t flex justify-between">
                  <button
                    onClick={() => setSelectedStatuses([])}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsStatusDropdownOpen(false)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Genre Filter Dropdown */}
          <div className="relative w-full md:w-auto z-50" ref={genreDropdownRef}>
            <button
              onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
              className="w-full z-50 md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
            >
              Filter by Genre
              <ChevronDown className="w-4 h-4" />
            </button>

            {isGenreDropdownOpen && (
              <div className="absolute left-0 md:left-auto right-0 top-full mt-2 w-full md:w-64 bg-white border rounded-lg shadow-lg">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search genres..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto z-40">
                  {selectedGenres.length > 0 && (
                    <div className="px-2 py-2 border-b flex flex-wrap gap-1">
                      {selectedGenres.map((genre) => (
                        <span
                          key={genre.mal_id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {genre.name}
                          <button
                            onClick={() => setSelectedGenres(selectedGenres.filter(g => g.mal_id !== genre.mal_id))}
                            className="hover:text-blue-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

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
                    onClick={() => setIsGenreDropdownOpen(false)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredWatchlist.map((anime, index) => (
            <div key={anime.id} className={`relative ${index >= loadedAnimeCount ? 'opacity-50' : ''}`}>
              <Link to={`/anime/${anime.anime_id}`} className="block">
                <div className="relative pt-[140%]">
                  <img
                    src={anime.anime_image}
                    alt={anime.anime_title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://via.placeholder.com/225x318?text=No+Image';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                    {anime.anime_title}
                  </h3>
                </div>
              </Link>

              <div className="px-4 pb-4">
                <select
                  value={anime.status || 'planning'}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateAnimeStatus(anime.id, e.target.value as WatchlistAnime['status']);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
                </select>
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
      {isLoadingMore && (
        <div className="flex justify-center items-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
