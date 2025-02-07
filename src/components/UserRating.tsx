import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { ChevronDown, X } from 'lucide-react';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import { saveNavigationState, getNavigationState } from '../utils/navigationState';
import { Pagination } from './Pagination';
import { useLocation } from 'react-router-dom';

// Cache for anime details
const animeCache: { [key: number]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface AnimeRating {
  id: number;
  anime_id: number;
  rating: number;
  title?: string;
  image_url?: string;
  anime_title?: string;
  anime_image?: string;
  updated_at?: string;
  isEnhanced?: boolean;
  genres?: { mal_id: number; name: string }[];
}

interface Genre {
  mal_id: number;
  name: string;
}

const ITEMS_PER_PAGE = 12;
const PLACEHOLDER_IMAGE = '/placeholder.jpg';
const BATCH_SIZE = 3;

export function UserRating() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<AnimeRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedAnimeCount, setLoadedAnimeCount] = useState(0);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const location = useLocation();

  const genreDropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside genre dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setIsGenreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGenres = allGenres.filter(genre =>
    genre.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter ratings based on selected genres and rating range
  const filteredRatings = useMemo(() => {
    if (!ratings) return [];
    
    return ratings.filter(anime => {
      const matchesGenres = selectedGenres.length === 0 || 
        selectedGenres.every(selectedGenre =>
          anime.genres?.some(genre => genre.mal_id === selectedGenre.mal_id)
        );
      
      const matchesRating = anime.rating >= ratingRange[0] && anime.rating <= ratingRange[1];

      return matchesGenres && matchesRating;
    });
  }, [ratings, selectedGenres, ratingRange]);

  // Handle rating range change
  const handleRatingRangeChange = useCallback((newRange: [number, number]) => {
    if (Array.isArray(newRange) && newRange.length === 2) {
      setRatingRange(newRange);
   }
  }, []);

  // Fetch anime details and update database
  const enhanceAnimeData = async (rating: AnimeRating) => {
    try {
      // Check if we already have the enhanced data
      if (rating.anime_title && rating.anime_image && rating.genres) {
        return {
          ...rating,
          title: rating.anime_title,
          image_url: rating.anime_image,
          isEnhanced: true
        };
      }

      // Fetch from API
      const animeData = await fetchFromAPI<any>(
        `/anime/${rating.anime_id}`,
        {},
        RequestPriority.LOW
      );

      if (!animeData?.data) {
        throw new Error('No data received from API');
      }

      // Update the database with the new information
      const { error: updateError } = await supabase
        .from('user_feedback')
        .update({
          anime_title: animeData.data.title,
          anime_image: animeData.data.images?.jpg?.image_url || null,
          genres: animeData.data.genres // Store genres in the database
        })
        .eq('id', rating.id)
        .not('anime_image', 'eq', PLACEHOLDER_IMAGE);

      if (updateError) {
        console.error('Error updating anime data:', updateError);
      }

      // Return enhanced rating
      return {
        ...rating,
        title: animeData.data.title,
        image_url: animeData.data.images?.jpg?.image_url || PLACEHOLDER_IMAGE,
        anime_title: animeData.data.title,
        anime_image: animeData.data.images?.jpg?.image_url || null,
        genres: animeData.data.genres,
        isEnhanced: true
      };
    } catch (error) {
      console.error(`Error enhancing anime ${rating.anime_id}:`, error);
      return rating;
    }
  };

  // Load ratings with progressive enhancement
  const fetchUserRatings = useCallback(async (page: number) => {
    if (!user) return;

    try {
      setError(null);
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      
      // Fetch total count
      const { count } = await supabase
        .from('user_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setTotalItems(count || 0);

      // Fetch paginated feedback
      const { data: userFeedback, error: feedbackError } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (feedbackError) throw feedbackError;

      // Initialize ratings with basic data
      setRatings(userFeedback.map(feedback => ({
        ...feedback,
        title: feedback.anime_title || undefined,
        image_url: feedback.anime_image || PLACEHOLDER_IMAGE,
        isEnhanced: !!(feedback.anime_title && feedback.anime_image)
      })));

      setLoading(false);

      // Progressively enhance data in batches
      const enhanceBatch = async (startIdx: number) => {
        if (startIdx >= userFeedback.length) {
          setIsLoadingMore(false);
          return;
        }

        setIsLoadingMore(true);
        const endIdx = Math.min(startIdx + BATCH_SIZE, userFeedback.length);
        const currentBatch = userFeedback.slice(startIdx, endIdx);

        const enhancedBatch = await Promise.all(
          currentBatch.map(rating => enhanceAnimeData(rating))
        );

        setRatings(prevRatings => {
          const newRatings = [...prevRatings];
          enhancedBatch.forEach((enhancedRating, idx) => {
            newRatings[startIdx + idx] = enhancedRating;
          });
          return newRatings;
        });

        setLoadedAnimeCount(endIdx);

        // Process next batch
        if (endIdx < userFeedback.length) {
          setTimeout(() => enhanceBatch(endIdx), 100);
        } else {
          setIsLoadingMore(false);
        }
      };

      // Start enhancing the first batch
      enhanceBatch(0);

    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError('Failed to load ratings');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Initialize from saved state
    const savedState = getNavigationState();
    if (savedState?.source?.component === 'UserRating' && savedState?.page) {
      setCurrentPage(savedState.page);
    }
  }, []);

  useEffect(() => {
    // Save state when page changes
    if (currentPage > 0) {  // Only save if page is valid
      saveNavigationState({
        pathname: location.pathname,
        search: location.search,
        page: currentPage,
        source: {
          component: 'UserRating'
        }
      });
    }
  }, [currentPage, location.pathname, location.search]);

  useEffect(() => {
    // Save navigation state when component mounts
    saveNavigationState({
      pathname: '/user/ratings',
      search: '',
      filters: {
        ratingRange,
        selectedGenres,
        searchTerm,
        currentPage
      }
    });
  }, [ratingRange, selectedGenres, searchTerm, currentPage]);

  useEffect(() => {
    fetchUserRatings(currentPage);
  }, [currentPage, fetchUserRatings]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setLoadedAnimeCount(0);
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-12 px-4 md:px-12 lg:px-24 xl:px-48">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Your Anime Ratings</h2>
        <p className="text-gray-600 mt-2">
          You have rated {totalItems} {totalItems === 1 ? 'anime' : 'anime'}
          {(selectedGenres.length > 0 || ratingRange[0] > 0 || ratingRange[1] < 10) && ' (filtered)'}
        </p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Genre Filter Dropdown */}
          <div className="relative w-full md:w-auto z-50" ref={genreDropdownRef}>
            <button
              onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
            >
              Filter by Genre
              <ChevronDown className="w-4 h-4" />
            </button>

            {isGenreDropdownOpen && (
              <div className="absolute left-0 md:left-auto left-0 top-full mt-2 w-full md:w-64 bg-white border rounded-lg shadow-lg">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search genres..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto">
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

          {/* Rating Range Slider */}
          <div className="w-full md:w-[300px]">
            <div className="bg-white border rounded-lg shadow-sm ">
              <div className="text-xs mt-1 font-medium text-center">Rating Range: {ratingRange[0]} - {ratingRange[1]}</div>
              <div className="px-4 py-2 ">
                <RangeSlider
                  min={0}
                  max={10}
                  id="range-slider-gradient"
                  className="margin-lg"
                  step={"1"}
                  value={ratingRange}
                  onInput={handleRatingRangeChange}
                  
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Anime Cards */}
      <div className=" grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredRatings.map((anime) => (
          <div
            key={anime.anime_id}
            className={`relative h-80 bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
              anime.isEnhanced ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <Link to={`/anime/${anime.anime_id}`}>
              <img
                src={anime.image_url || PLACEHOLDER_IMAGE}
                alt={anime.title || `Anime ${anime.anime_id}`}
                className="w-full h-[70%] object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = PLACEHOLDER_IMAGE;
                }}
              />
              <div className=" mt-1">
                <h3 className="ml-2 text-sm font-medium text-gray-900 line-clamp-2">
                  {anime.title || `Loading...`}
                </h3>
                <div className="flex items-center ml-2 mt-2 flex-wrap absolute bottom-8">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-3 h-3 ${
                        i < anime.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {anime.updated_at && (
                  <div className="text-sm text-gray-500 mt-2 ml-2 absolute bottom-2">
                    {new Date(anime.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>

      {totalItems > ITEMS_PER_PAGE && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
            onPageChange={handlePageChange}
            isLoading={loading || isLoadingMore}
          />
        </div>
      )}
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {isLoadingMore && (
        <div className="text-center mt-4">
          <p className="text-gray-600">
            Loading more details... ({loadedAnimeCount} / {ratings.length})
          </p>
        </div>
      )}

    </div>
  );
}
