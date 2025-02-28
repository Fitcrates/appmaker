import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSupabase } from '../context/SupabaseContext';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, Info, Bookmark } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { Tooltip } from './ui/Tooltip';
import { Pagination } from './Pagination';
import { GenreFilter } from './ui/Filters/GenreFilter';
import { AnimePreview } from './AnimePreview';
import { useWatchlist } from '../hooks/useWatchlist';
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';

const ITEMS_PER_PAGE = 10;
const PLACEHOLDER_IMAGE = '/placeholder.jpg';

interface RatedAnime {
  id: number;
  anime_id: number;
  user_id: string;
  rating: number;
  anime_title?: string;
  anime_image?: string;
  anime_type?: string;
  anime_episodes?: number;
  genres?: { mal_id: number; name: string }[];
  created_at?: string;
}

interface Genre {
  mal_id: number;
  name: string;
}

export function UserRating() {
  const { user, supabase } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratedAnime, setRatedAnime] = useState<any[]>([]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [imageLoadError, setImageLoadError] = useState<{ [key: number]: boolean }>({});
  const [cache, setCache] = useState<{ [key: string]: { data: RatedAnime[]; count: number } }>({});
  const [animeDetails, setAnimeDetails] = useState<{ [key: number]: any }>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState<{ [key: number]: boolean }>({});

  const getCacheKey = useCallback((page: number) => {
    return `${page}-${ratingRange[0]}-${ratingRange[1]}-${selectedGenres.map(g => g.mal_id).join(',')}`;
  }, [ratingRange, selectedGenres]);

  const handleImageError = (animeId: number) => {
    setImageLoadError(prev => ({ ...prev, [animeId]: true }));
  };

  // Load rated anime with caching
  const fetchRatedAnime = useCallback(async (page: number, isPrefetch = false) => {
    if (!user || !supabase) {
      setIsLoading(false);
      return;
    }

    const cacheKey = getCacheKey(page);
    
    // Check cache first
    if (cache[cacheKey]) {
      if (!isPrefetch) {
        setRatedAnime(cache[cacheKey].data);
        setTotalItems(cache[cacheKey].count);
        setIsLoading(false);
      }
      return;
    }

    if (!isPrefetch) {
      setIsLoading(true);
    }

    try {
      setError('');
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      
      let query = supabase
        .from('user_feedback')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('rating', ratingRange[0])
        .lte('rating', ratingRange[1]);

      if (selectedGenres.length > 0) {
        const genreIds = selectedGenres.map(g => g.mal_id);
        query = query.contains('genres', genreIds.map(id => ({ mal_id: id })));
      }

      const { data: ratingData, error: ratingError, count } = await query
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (ratingError) throw ratingError;

      // Update cache
      const newData = { data: ratingData || [], count: count || 0 };
      setCache(prev => ({
        ...prev,
        [cacheKey]: newData
      }));

      if (!isPrefetch) {
        setRatedAnime(ratingData || []);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      if (!isPrefetch) {
        setError('Failed to load ratings');
      }
    } finally {
      if (!isPrefetch) {
        setIsLoading(false);
      }
    }
  }, [user, supabase, selectedGenres, ratingRange, getCacheKey, cache]);

  // Prefetch next page
  const prefetchNextPage = useCallback((nextPage: number) => {
    if (nextPage <= Math.ceil(totalItems / ITEMS_PER_PAGE)) {
      fetchRatedAnime(nextPage, true);
    }
  }, [fetchRatedAnime, totalItems]);

  // Clear cache when filters change
  useEffect(() => {
    setCache({});
  }, [ratingRange, selectedGenres]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load initial data and handle filter changes
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    fetchRatedAnime(page);
  }, [fetchRatedAnime, searchParams]);

  // Handle filter changes
  useEffect(() => {
    if (searchParams.get('page') !== '1') {
      const params = new URLSearchParams(searchParams);
      params.set('page', '1');
      setSearchParams(params);
    }
  }, [ratingRange, selectedGenres]);

  // Keep currentPage in sync with URL
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    setCurrentPage(page);
  }, [searchParams]);

  const fetchAnimeDetails = useCallback(async (animeId: number) => {
    if (animeDetails[animeId]) return animeDetails[animeId];
    if (isLoadingDetails[animeId]) return null;

    setIsLoadingDetails(prev => ({ ...prev, [animeId]: true }));
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
      const data = await response.json();
      
      if (data.data) {
        setAnimeDetails(prev => ({ ...prev, [animeId]: data.data }));
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching anime details:', error);
    } finally {
      setIsLoadingDetails(prev => ({ ...prev, [animeId]: false }));
    }
    return null;
  }, [animeDetails, isLoadingDetails]);

  const handleAnimeDetails = useCallback(async (anime: RatedAnime) => {
    const details = await fetchAnimeDetails(anime.anime_id);
    
    if (details) {
      setSelectedAnime({
        ...details,
        mal_id: anime.anime_id,
        title: details.title || anime.anime_title,
        images: { 
          jpg: { 
            large_image_url: details.images?.jpg?.large_image_url || anime.anime_image,
            image_url: details.images?.jpg?.image_url || anime.anime_image
          }
        }
      });
    }
  }, [fetchAnimeDetails]);

  const handleInfoClick = useCallback(async (e: React.MouseEvent, anime: RatedAnime) => {
    e.stopPropagation();
    await handleAnimeDetails(anime);
  }, [handleAnimeDetails]);

  return (
    <div className="container min-h-screen mx-auto py-2 md:py-12 max-w-[100rem] backgroundMain ">
      <div className="flex flex-col md:flex-row  md:justify-between gap-4  max-w-[100rem]  px-4 sm:px-6 lg:px-8 justify-start items-center mx-auto mb-12">
        <h1 className="text-3xl text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon mt-24 mb-12 ">My Ratings</h1>

        <div className="relative mt-6 mb-12 md:mt-24 md:mb-12 flex items-center">
          <span className="bg-clip-text text-[#fd5454] drop-shadow-[0_2px_12px_#fd5454] tilt-neon2 px-4 py-2">
            Total Rated: {totalItems}
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            xmlnsXlink="http://www.w3.org/1999/xlink" 
            viewBox="0 0 80 80"
            className="absolute -right-2 w-14 h-14 stroke-[#fd5454] drop-shadow-[0_0_8px_#fd5454] stroke-2 fill-none"
          >
            <defs>
              <path id="cLinkPath" d="M-1-1v21.3h10.1v39.4h-10.1v21.3h82v-82z"></path>
            </defs>
            <clipPath id="cLinkMask">
              <use xlinkHref="#cLinkPath" overflow="visible"></use>
            </clipPath>
            <path 
              className="drop-shadow-[0_0_8px_#fd5454]" 
              d="M5 24c6.1-13.3 19.5-22.5 35-22.5 21.3 0 38.5 17.2 38.5 38.5s-17.2 38.5-38.5 38.5c-15.5 0-28.9-9.2-35-22.5"
            />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between md:justify-start gap-4  max-w-[100rem]  px-4 sm:px-6 lg:px-8 justify-left items-center mx-auto mb-12">
        {/* Rating Range Slider */}
        <div className="w-full md:w-[300px]">
          <div className=" ring-1 ring-white/40 rounded-lg shadow-sm">
            <div className="text-xs  pt-1 font-medium text-center text-white">
              Rating Range: {ratingRange[0]} - {ratingRange[1]}
            </div>
            <div className="px-4 py-2">
              <RangeSlider
                min={0}
                max={10}
                id="range-slider-gradient"
                className="margin-lg"
                step={"1"}
                value={ratingRange}
                onInput={setRatingRange}
              />
            </div>
          </div>
        </div>
        <GenreFilter
          selectedGenres={selectedGenres}
          onGenreChange={setSelectedGenres}
        />
      </div>

      {error && (
        <div className="text-red-500 mb-4 px-4 md:px-12 lg:px-24 xl:px-48">{error}</div>
      )}

      {/* Ratings Grid */}
      <div className="space-y-6 px-0 max-w-[100rem]  sm:px-6 lg:px-8 justify-left items-center mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <div 
                key={index} 
                className="relative group max-h-[27rem] rounded-xl shadow-lg overflow-hidden animate-pulse"
              >
                <div className="relative rounded-t-xl overflow-hidden aspect-[3/4] max-h-[18rem] bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {ratedAnime.map((anime) => (
              <div
                key={anime.id}
                className="relative group max-h-[27rem] rounded-xl shadow-lg overflow-hidden 
                  transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/20 cursor-pointer flex flex-col"
                onClick={() => handleAnimeDetails(anime)}
              >
                <LazyLoad>
                  <div className="relative rounded-t-xl overflow-t-hidden aspect-[3/4] max-h-[18rem]">
                    <img
                      src={imageLoadError[anime.anime_id] ? PLACEHOLDER_IMAGE : (anime.anime_image || PLACEHOLDER_IMAGE)}
                      alt={anime.anime_title}
                      className="absolute inset-0 aspect-[3/4] w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImageError(anime.anime_id)}
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex space-x-2 items-center text-white">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span>{anime.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </LazyLoad>
                <div className="p-4 bg-black/40 backdrop-blur-sm border-t border-[#43b5a0]/20">
                  <h3 className="text-white font-medium truncate">{anime.anime_title}</h3>
                  
                  {anime.created_at && (
                    <div className="text-sm mt-2 text-white/80">
                      Added on: {new Date(anime.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex gap-2">
                    <Tooltip content={isInWatchlist[anime.anime_id] ? "Remove from Watchlist" : "Add to Watchlist"}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          isInWatchlist[anime.anime_id]
                            ? removeFromWatchlist(anime.anime_id)
                            : addToWatchlist({
                                mal_id: anime.anime_id,
                                title: anime.anime_title,
                                images: { jpg: { image_url: anime.anime_image } }
                              });
                        }}
                        className={`p-2.5 backdrop-blur-sm rounded-full shadow-lg border border-white/10 
                        transition-colors duration-200 ${isInWatchlist[anime.anime_id] 
                          ? "bg-[#1A1C23]/90 hover:bg-[#EC4899]" 
                          : "bg-[#1A1C23]/90 hover:bg-[#6366F1]"}`}
                        aria-label={isInWatchlist[anime.anime_id] ? "Remove from watchlist" : "Add to watchlist"}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            isInWatchlist[anime.anime_id] ? "text-[#6366F1] fill-current" : "text-white"
                          }`}
                        />
                      </button>
                    </Tooltip>

                    <Tooltip content="View Details">
                      <button
                        onClick={(e) => handleInfoClick(e, anime)}
                        className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors duration-200"
                      >
                        <Info className="w-5 h-5 text-white" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAnime && (
        <AnimePreview
          anime={selectedAnime}
          isOpen={!!selectedAnime}
          onClose={() => setSelectedAnime(null)}
        />
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
            onPageChange={handlePageChange}
            onPageHover={prefetchNextPage}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
