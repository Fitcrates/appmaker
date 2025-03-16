import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, Bookmark, Info } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import { SearchBar } from '../components/ui/Filters/SearchBar';
import { GeneralFilter } from '../components/ui/Filters/GeneralFilter';
import { Pagination } from '../components/Pagination';
import { useWatchlist } from '../hooks/useWatchlist';
import { AnimePreview } from '../components/AnimePreview';
import { Slideshow } from '../components/Slideshow';
import { useAnimeStore } from '../store/animeStore';
import { Tooltip } from '../components/ui/Tooltip';

interface Anime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  type?: 'TV' | 'Movie' | 'OVA' | 'Special' | 'ONA';
  episodes?: number;
  status?: string;
  rating?: string;
  score: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  year?: number;
  images: {
    jpg: {
      image_url: string;
      small_image_url?: string;
      large_image_url?: string;
    };
    webp?: {
      image_url?: string;
      small_image_url?: string;
      large_image_url?: string;
    };
  };
  genres?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  studios?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
}

interface APIResponse {
  data: Anime[];
  pagination: {
    last_visible_page: number;
    items: {
      total: number;
    };
  };
}

const GenrePage: React.FC = () => {
  // Search and pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [shouldSearch, setShouldSearch] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');

  // Get state from Zustand store
  const {
    searchQuery,
    currentPage,
    selectedGenres,
    selectedCreators,
    selectedStudios,
    scoredBySort,
    showTvSeries,
    showMovies,
    hideHentai,
    setCurrentPage,
    setSearchQuery
  } = useAnimeStore();

  // Set initial search query from store
  useEffect(() => {
    if (searchQuery && window.location.hash === '#exploreAnime') {
      setCurrentSearchQuery(searchQuery);
      setShouldSearch(true);
    }
  }, []);

  // Preview modal state
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  // Watchlist hook
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  // Create a ref to track the initial render for the sort effect
  const isInitialSortRender = useRef(true);

  // Fetch anime based on filters
  const fetchAnime = useCallback(async (page?: number, bypassCache?: boolean) => {
    setIsSearching(true);
    try {
      // Regular search with filters
      const params: Record<string, any> = {
        page: page || currentPage,
        limit: 25,
        order_by: 'score',
        sort: scoredBySort || 'desc',
        sfw: hideHentai
      };

      // Handle search query
      if (currentSearchQuery) {
        params.q = currentSearchQuery;
      }

      // Handle genres
      if (selectedGenres.length > 0) {
        params.genres = selectedGenres.map(g => g.id).join(',');
      }

      // Handle studios
      if (selectedStudios.length > 0) {
        params.producers = selectedStudios.map(s => s.mal_id).join(',');
      }

      // Handle creators separately if selected
      if (selectedCreators.length > 0) {
        const creatorAnimePromises = selectedCreators.map(creator =>
          fetchFromAPI<{ data: { anime: any[] } }>(`/people/${creator.mal_id}/full`)
        );

        const creatorResults = await Promise.all(creatorAnimePromises);
        const creatorAnimeDetails: Anime[] = [];
        const seenAnimeIds = new Set<number>();

        creatorResults.forEach(result => {
          if (result?.data?.anime) {
            result.data.anime.forEach((entry: any) => {
              if (entry.anime?.mal_id && !seenAnimeIds.has(entry.anime.mal_id)) {
                seenAnimeIds.add(entry.anime.mal_id);
                creatorAnimeDetails.push(entry.anime);
              }
            });
          }
        });

        // Apply other filters to creator results
        let filteredData = [...creatorAnimeDetails];

        // Apply type filter
        if (showTvSeries !== showMovies) {
          filteredData = filteredData.filter(anime => 
            (showTvSeries && anime.type === 'TV') || 
            (showMovies && anime.type === 'Movie')
          );
        }

        // Apply genre filter if any
        if (selectedGenres.length > 0) {
          filteredData = filteredData.filter(anime => 
            anime.genres?.some(genre => 
              selectedGenres.some(g => g.id === genre.mal_id)
            )
          );
        }

        // Apply studio filter if any
        if (selectedStudios.length > 0) {
          filteredData = filteredData.filter(anime =>
            anime.studios?.some(studio =>
              selectedStudios.some(s => s.mal_id === studio.mal_id)
            )
          );
        }

        // Apply search query if any
        if (currentSearchQuery) {
          const query = currentSearchQuery.toLowerCase();
          filteredData = filteredData.filter(anime =>
            anime.title?.toLowerCase().includes(query) ||
            anime.title_english?.toLowerCase().includes(query) ||
            anime.title_japanese?.toLowerCase().includes(query)
          );
        }

        // Sort the results
        filteredData.sort((a, b) => {
          const aScore = a.score || 0;
          const bScore = b.score || 0;
          return scoredBySort === 'asc' ? aScore - bScore : bScore - aScore;
        });

        // Apply hentai filter
        if (hideHentai) {
          filteredData = filteredData.filter(anime => anime.rating !== 'rx');
        }

        // Handle pagination for creator results
        const itemsPerPage = 25;
        const totalItems = filteredData.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = ((page || currentPage) - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        setAnimeList(filteredData.slice(startIndex, endIndex));
        setTotalPages(totalPages);
        setTotalItems(totalItems);
        setIsSearching(false);
        setShouldSearch(false);
        return;
      }

      // Handle type filter for API request
      const types = [];
      if (showTvSeries) types.push('tv');
      if (showMovies) types.push('movie');
      if (types.length === 1) {
        params.type = types[0];
      }

      // Set bypass_cache for any active filters
      const hasFilters = selectedGenres.length > 0 || 
                        selectedStudios.length > 0 || 
                        currentSearchQuery || 
                        (showTvSeries && !showMovies) || 
                        (!showTvSeries && showMovies);

      if (bypassCache || hasFilters) {
        params.bypass_cache = true;
      }

      const response = await fetchFromAPI<APIResponse>('/anime', params);
      
      if (response?.data) {
        // Filter out hentai content
        const filteredData = hideHentai
          ? response.data.filter((anime: Anime) => anime.rating !== 'rx')
          : response.data;

        setAnimeList(filteredData);
        setTotalPages(response.pagination?.last_visible_page || 1);
        setTotalItems(response.pagination?.items?.total || 0);
      } else {
        setAnimeList([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching anime:', error);
      setAnimeList([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsSearching(false);
      setShouldSearch(false);
    }
  }, [currentPage, selectedGenres, selectedCreators, selectedStudios, scoredBySort, showTvSeries, showMovies, hideHentai, currentSearchQuery]);

  // Initial fetch and handle hash change
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#exploreAnime') {
        setShouldSearch(true);
      }
    };

    // Initial fetch if we're on the correct hash
    if (window.location.hash === '#exploreAnime') {
      setShouldSearch(true);
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Effect to trigger search when filters change
  useEffect(() => {
    if (!isInitialSortRender.current) {
      // Only reset page when filters change, not on initial render
      if (selectedGenres.length > 0 || selectedCreators.length > 0 || selectedStudios.length > 0 || 
          showTvSeries !== true || showMovies !== true || hideHentai !== true || scoredBySort !== null) {
        setCurrentPage(1);
      }
      setShouldSearch(true);
    } else {
      isInitialSortRender.current = false;
    }
  }, [selectedGenres, selectedCreators, selectedStudios, showTvSeries, showMovies, hideHentai, setCurrentPage, scoredBySort]);

  // Effect to handle search trigger
  useEffect(() => {
    if (shouldSearch) {
      fetchAnime(currentPage, true);
    }
  }, [fetchAnime, shouldSearch, currentPage]);

  // Effect to handle filter reset
  useEffect(() => {
    // Check if all filters are at their initial state
    const isFiltersReset = selectedGenres.length === 0 && 
                          selectedCreators.length === 0 && 
                          selectedStudios.length === 0 && 
                          showTvSeries === true && 
                          showMovies === true && 
                          hideHentai === true && 
                          scoredBySort === null;

    // If filters are reset but there's a search query, clear it
    if (isFiltersReset && searchQuery === '' && currentSearchQuery !== '') {
      setCurrentSearchQuery('');
      setCurrentPage(1);
      setShouldSearch(true);
    }
  }, [selectedGenres, selectedCreators, selectedStudios, showTvSeries, showMovies, hideHentai, scoredBySort, searchQuery, currentSearchQuery]);

  const handleSearch = () => {
    setCurrentSearchQuery(searchQuery);
    // Only reset page on new search
    if (searchQuery !== currentSearchQuery) {
      setCurrentPage(1);
    }
    setShouldSearch(true);
  };

  const handleClearSearch = () => {
    setCurrentSearchQuery('');
    setSearchQuery('');
    setCurrentPage(1); // Reset page on clear
    setShouldSearch(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setShouldSearch(true);
  };

  return (
    <div className="min-h-screen backgroundMain">
      {/* Anime Preview Modal */}
      {selectedAnime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAnime(null)}></div>
          <div className="relative z-10 w-full max-w-4xl p-4">
            <AnimePreview 
              anime={selectedAnime} 
              onClose={() => setSelectedAnime(null)}
              isOpen={!!selectedAnime}
            />
          </div>
        </div>
      )}
      <Slideshow />
      <main className="container mx-auto mb-8 ">
        <div className="space-y-8">
          {/* Header section */}
          <div id="exploreAnime" className="text-center mt-24">
            <h1 className="text-4xl bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon">Anime Search</h1>
            <p className="mt-6  bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon4  leading-tight">
              Search and filter through thousands of anime titles
            </p>
          </div>
          {/* Filters Section  */}
          <section className="my-8 scroll-mt-24">
            <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
              {/* Search Input - Full Width */}
              <div className="mb-4 w-full mx-auto">
                <SearchBar 
                  handleSearch={handleSearch}
                  handleClearSearch={handleClearSearch}
                  isSearching={isSearching}
                />
              </div>
              {/* Filters and Results Row - Always in one row */}
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-4">
                    <GeneralFilter />
                  </div>
                </div>
                
                {/* Results Counter */}
                <div className="relative flex items-center">
                  <span className="bg-clip-text text-[#ff13f0] drop-shadow-[0_2px_12px_#ff13f0] tilt-neon2 px-4 py-2">
                    Results: <span className="notranslate">{totalItems || 0}</span>
                  </span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    xmlnsXlink="http://www.w3.org/1999/xlink" 
                    viewBox="0 0 80 80"
                    className="absolute -right-2 w-14 h-14 stroke-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] stroke-2 fill-none"
                  >
                    <defs>
                      <path id="cLinkPath" d="M-1-1v21.3h10.1v39.4h-10.1v21.3h82v-82z"></path>
                    </defs>
                    <clipPath id="cLinkMask">
                      <use xlinkHref="#cLinkPath" overflow="visible"></use>
                    </clipPath>
                    <path 
                      className="drop-shadow-[0_0_8px_#ff13f0]" 
                      d="M5 24c6.1-13.3 19.5-22.5 35-22.5 21.3 0 38.5 17.2 38.5 38.5s-17.2 38.5-38.5 38.5c-15.5 0-28.9-9.2-35-22.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </section>
          
          {/* Results Section with card styling */}
          <div className="max-w-[100rem] space-y-6 mx-auto px-2 sm:px-6 lg:px-8 mt-12 min-h-[30rem] sm:min-h-[40rem] md:min-h-[50rem]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {isSearching ? (
                // Skeleton loading cards
                Array.from({ length: 10 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="relative">
                    <div className="relative rounded-xl shadow-lg overflow-hidden border border-white/20 flex flex-col h-[22rem] sm:h-[22rem] md:h-[23rem] lg:h-[24rem] xl:h-[25rem]">
                      {/* Skeleton Image Container */}
                      <div className="relative rounded-t-xl overflow-t-hidden aspect-[2/3] h-[15rem] sm:h-[14rem] md:h-[16rem] lg:h-[17rem] xl:h-[18rem] bg-black/20 animate-pulse">
                        {/* Skeleton Score */}
                        <div className="absolute top-3 left-1 sm:left-3 bg-black/20 rounded-full w-20 h-8"></div>
                      </div>
                      
                      {/* Skeleton Title and Info */}
                      <div className="h-full p-2 pt-2 pl-2 bg-black/20 border-t border-[#43b5a0]/20">
                        {/* Skeleton Title */}
                        <div className="h-6 bg-black/20 rounded w-3/4 mb-2"></div>
                        {/* Skeleton Text */}
                        <div className="h-4 bg-black/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                animeList.map((anime, index) => (
                  <div key={`${anime.mal_id}-${index}`} className="relative group">
                    <div
                      className="relative rounded-xl shadow-lg overflow-hidden 
                      transition-all duration-300 hover:scale-105 hover:shadow-xl 
                      border border-white/20 cursor-pointer flex flex-col h-[22rem] sm:h-[22rem] md:h-[23rem] lg:h-[24rem] xl:h-[25rem]"
                      onClick={() => setSelectedAnime(anime)}
                    >
                      {/* Image Container */}
                      <div className="relative rounded-t-xl overflow-t-hidden aspect-[2/3] h-[15rem] sm:h-[14rem] md:h-[16rem] lg:h-[17rem] xl:h-[18rem]">
                        <img
                          src={anime.images.jpg.image_url}
                          alt={anime.title}
                          className="w-full h-full object-cover aspect-[2/3] transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        {anime.score > 0 && (
                          <div className="absolute top-3 left-1 sm:left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center">
                            <Star className="w-4 h-4 text-[#F59E0B]" />
                            <span className="ml-1.5 text-sm font-mono text-white notranslate">{anime.score ? anime.score.toFixed(1) : '??'}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Title and Info area below the image */}
                      <div className="h-full p-2 pt-2 pl-2 bg-black/20 backdrop-blur-sm border-t border-[#43b5a0]/20">
                        <h3 className="font-medium text-[#F2F5F7] line-clamp-2 text-lg group-hover:text-white 
                        transition-colors duration-200 w-full">
                          {anime.title}
                        </h3>
                        <div className="absolute flex items-center bottom-1 opacity-70 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-xs text-[#F2F5F7]/90">
                            {anime.year && <span className="notranslate">{anime.year}</span>}
                            {anime.genres && anime.genres.length > 0 && (
                              <span className="line-clamp-1">
                                {anime.genres.map(genre => genre.name).join(', ')}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex gap-1">
                        <Tooltip content={isInWatchlist[anime.mal_id] ? "Remove from Watchlist" : "Add to Watchlist"}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              isInWatchlist[anime.mal_id]
                                ? removeFromWatchlist(anime.mal_id)
                                : addToWatchlist(anime);
                            }}
                            className={`p-2.5 backdrop-blur-sm rounded-full shadow-lg border border-white/10 
                            transition-colors duration-200 ${isInWatchlist[anime.mal_id] 
                              ? "bg-[#1A1C23]/90 hover:bg-[#EC4899]" 
                              : "bg-[#1A1C23]/90 hover:bg-[#6366F1]"}`}
                            aria-label={isInWatchlist[anime.mal_id] ? "Remove from watchlist" : "Add to watchlist"}
                          >
                            <Bookmark
                              className={`w-4 h-4 ${
                                isInWatchlist[anime.mal_id] ? "text-[#6366F1] fill-current" : "text-white"
                              }`}
                            />
                          </button>
                        </Tooltip>

                        <Tooltip content="View Details">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAnime(anime);
                            }}
                            className="p-2.5 bg-[#1A1C23]/90 backdrop-blur-sm rounded-full shadow-lg border border-white/10 
                            hover:bg-[#6366F1] transition-colors duration-200"
                            aria-label="View anime details"
                          >
                            <Info className="w-4 h-4 text-white" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
  
          {/* Pagination section */}
          {!isSearching && totalPages > 0 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isSearching}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GenrePage;
