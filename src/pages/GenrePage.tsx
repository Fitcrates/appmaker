import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, Bookmark } from 'lucide-react'; // Import Bookmark here
import { fetchFromAPI } from '../utils/api';
import { SearchBar } from '../components/ui/Filters/SearchBar';
import { GeneralFilter } from '../components/ui/Filters/GeneralFilter';
import { Tooltip } from '../components/ui/Tooltip';
import { WatchlistButton } from '../components/ui/Buttons/WatchlistButton';
import { Info } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { Genre } from '../hooks/useGenreFilter';
import { Creator } from '../hooks/useCreatorFilter';
import { Studio } from '../hooks/useStudioFilter';
import { useWatchlist } from '../hooks/useWatchlist';
import { AnimePreview } from '../components/AnimePreview';
import { useAnimeDetails } from '../hooks/useAnimeDetails';
import { Slideshow } from '../components/Slideshow';
import { Anime } from '../types/anime';
import { useAnimeSort } from '../hooks/useAnimeSort';
import Breadcrumbs from '../components/Breadcrumbs';

interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  score: number;
  year: number;
  genres: Genre[];
  studios: Studio[];
  producers: Creator[];
}

const GenrePage: React.FC = () => {
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [fullAnimeList, setFullAnimeList] = useState<Anime[]>([]);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [shouldSearch, setShouldSearch] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(false);

  // Filter states
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<Creator[]>([]);
  const [selectedStudios, setSelectedStudios] = useState<Studio[]>([]);
  const [scoredBySort, setScoredBySort] = useState<'asc' | 'desc' | null>(null);
  const [showTvSeries, setShowTvSeries] = useState(true);
  const [showMovies, setShowMovies] = useState(true);
  const [hideHentai, setHideHentai] = useState(true);  // Set to true by default

  // Preview modal state
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Watchlist hook
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  // Anime details hook
  const { fetchAnimeDetails, isLoading: isLoadingDetails } = useAnimeDetails();

  // Anime sort hook
  const { sortAnimeList } = useAnimeSort();

  // Create a ref to track the initial render for the sort effect
  const isInitialSortRender = useRef(true);

  // Effect to update current page items
  useEffect(() => {
    if (!fullAnimeList.length) return;

    // Only handle pagination locally if we have the full list
    const itemsPerPage = 25;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Sort the anime based on current sort parameters
    const sortedAnime = [...fullAnimeList].sort((a, b) => {
      const aScore = a.score || 0;
      const bScore = b.score || 0;
      return scoredBySort === 'desc' ? bScore - aScore : aScore - bScore;
    });

    // Apply hentai filter if needed
    const filteredData = hideHentai 
      ? sortedAnime.filter(anime => anime.rating !== 'rx')
      : sortedAnime;
          
    // Calculate total pages
    const totalItems = filteredData.length;
    setTotalPages(Math.ceil(totalItems / itemsPerPage));
    
    // Get the items for the current page
    const pageItems = filteredData.slice(startIndex, endIndex);
    setAnimeList(pageItems);
  }, [fullAnimeList, currentPage, scoredBySort, hideHentai]);

  // Fetch anime based on filters
  const fetchAnime = useCallback(async (page?: number, bypassCache?: boolean) => {
    setIsSearching(true);
    // Capture the current searchQuery value at the time of execution
    const currentSearchQuery = searchQuery;
    console.log("fetchAnime called with query:", currentSearchQuery); // Debug log
    try {
      if (selectedCreators.length > 0) {
        const creatorAnimeDetails: Anime[] = [];
        const seenAnimeIds = new Set<number>();
        
        for (const creator of selectedCreators) {
          try {
            const result = await fetchFromAPI<any>(`/people/${creator.mal_id}/full`);
            
            if (result?.data?.anime) {
              result.data.anime.forEach((entry: any) => {
                if (entry.anime?.mal_id && !seenAnimeIds.has(entry.anime.mal_id)) {
                  seenAnimeIds.add(entry.anime.mal_id);
                  creatorAnimeDetails.push(entry.anime);
                }
              });
            }
          } catch (creatorError) {
            console.warn(`Failed to fetch data for creator ${creator.name} (ID: ${creator.mal_id}):`, creatorError);
          }
        }
        
        if (creatorAnimeDetails.length === 0) {
          setFullAnimeList([]);
          setAnimeList([]);
          setTotalPages(0);
          return;
        }

        // Filter out hentai content if hideHentai is true
        const filteredCreatorAnime = hideHentai 
          ? creatorAnimeDetails.filter((anime: any) => anime.rating !== 'rx')
          : creatorAnimeDetails;

        // Store the full list and let the effect handle sorting and pagination
        setFullAnimeList(filteredCreatorAnime);
        setShouldSearch(false);
        return;
      }

      const params: Record<string, any> = {
        page: page || currentPage,
        limit: 25,
        order_by: 'score',
        sort: scoredBySort || 'desc'
      };

      // Check if any filters are applied
      const hasFilters = currentSearchQuery || 
                         selectedGenres.length > 0 || 
                         selectedStudios.length > 0 || 
                         (showTvSeries && !showMovies) || 
                         (!showTvSeries && showMovies);

      // Only bypass cache when:
      // 1. Explicitly changing pages (page parameter is explicitly passed)
      // 2. When filters are applied
      // 3. When bypassCache is explicitly set to true
      const shouldBypassCache = 
        (page !== undefined && page > 0) || // Only when explicitly changing pages
        hasFilters || // Only when filters are applied
        bypassCache; // When bypassCache is explicitly set to true
      
      if (shouldBypassCache) {
        params.bypass_cache = true;
      }

      if (currentSearchQuery) {
        params.q = currentSearchQuery;
      }

      if (selectedGenres.length > 0) {
        params.genres = selectedGenres.map(g => g.id).join(',');
      }

      if (selectedStudios.length > 0) {
        params.producers = selectedStudios.map(s => s.mal_id).join(',');
      }

      // Add filter to exclude hentai directly in the API request
      if (hideHentai) {
        params.sfw = true;
      }

      const types = [];
      if (showTvSeries) types.push('tv');
      if (showMovies) types.push('movie');
      if (types.length === 1) {
        params.type = types[0];
      }

      console.log("API params:", params);

      const response = await fetchFromAPI<any>('/anime', params);
      console.log("API response:", response);
      
      if (response?.data) {
        // Additional client-side filter for hentai content
        const filteredData = hideHentai 
          ? response.data.filter((anime: any) => anime.rating !== 'rx')
          : response.data;

        // Set total pages from the API response pagination info
        if (response.pagination) {
          setTotalPages(response.pagination.last_visible_page || 1);
          setTotalItems(response.pagination.items.total || 0);
        }
        
        setFullAnimeList([]); // Clear the full list when using API pagination
        setAnimeList(filteredData);
      }
    } catch (error) {
      console.error('Error fetching anime:', error);
      setAnimeList([]);
      setTotalPages(0);
    } finally {
      setIsSearching(false);
    }
  }, [currentPage, scoredBySort, selectedGenres, selectedStudios, 
      selectedCreators, hideHentai, showTvSeries, showMovies, searchQuery]);

  // Effect to clear anime list when shouldSearch is set to true
  useEffect(() => {
    if (shouldSearch) {
      // Clear the current anime list to ensure we don't show stale results
      setAnimeList([]);
      console.log("shouldSearch is true, cleared anime list");
    }
  }, [shouldSearch]);

  // Only fetch when filters change or shouldSearch is true
  useEffect(() => {
    if (shouldSearch) {
      console.log("Calling fetchAnime because shouldSearch is true");
      fetchAnime();
      // Reset shouldSearch after fetch is initiated
      setShouldSearch(false);
    }
  }, [fetchAnime, shouldSearch]);

  
  // This prevents multiple competing API calls
  useEffect(() => {
    if (isInitialSortRender.current) {
      isInitialSortRender.current = false;
      return;
    }
    
    // Reset to first page when sorting changes
    setCurrentPage(1);
    
    // Clear the anime list to prevent showing stale data
    setAnimeList([]);
    
    // This ensures we get fresh data when changing sort order
    console.log(`Sort changed to ${scoredBySort}, making direct API call with bypass_cache`);
    fetchAnime(1, true);
    
    // Prevent the shouldSearch mechanism from triggering another fetch
    setShouldSearch(false);
  }, [scoredBySort]);

  // Effect to clear fullAnimeList when filters change
  useEffect(() => {
    setFullAnimeList([]);
  }, [selectedGenres, selectedStudios, showTvSeries, showMovies]);

  
  // This prevents double fetching
  useEffect(() => {
  }, [currentPage]);

  // Initial fetch on mount
  useEffect(() => {
    fetchAnime(undefined);
  }, []);

  const handleSearch = (page: number) => {
    setCurrentPage(page);
    fetchAnime(page, true);
    
    // Log for debugging
    console.log("Search triggered with query:", searchQuery);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Directly call fetchAnime with the new page
    fetchAnime(page, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInfoClick = async (anime: Anime) => {
    try {
      const details = await fetchAnimeDetails(anime.mal_id);
      if (details) {
        setSelectedAnime(details);
        setIsPreviewOpen(true);
      }
    } catch (error) {
      console.error('Error fetching anime details:', error);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedAnime(null);
  };

  return (
    
    <div className="min-h-screen backgroundMain ">
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
<section 
  
  className="my-8 scroll-mt-24"
>
  <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
    {/* Search Input - Full Width */}
    <div className="mb-4 w-full mx-auto">
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        isSearching={isSearching}
      />
    </div>

    {/* Filters and Results Row - Always in one row */}
    <div className="flex justify-between items-center w-full">
      {/* General Filter */}
      <div>
        <GeneralFilter
          selectedGenres={selectedGenres}
          setSelectedGenres={(genres) => {
            setSelectedGenres(genres);
            setCurrentPage(1);
            setShouldSearch(true);
          }}
          selectedCreators={selectedCreators}
          setSelectedCreators={(creators) => {
            setSelectedCreators(creators);
            setCurrentPage(1);
            setShouldSearch(true);
          }}
          selectedStudios={selectedStudios}
          setSelectedStudios={(studios) => {
            setSelectedStudios(studios);
            setCurrentPage(1);
            setShouldSearch(true);
          }}
          scoredBySort={scoredBySort}
          setScoredBySort={(sort) => {
            setScoredBySort(sort);
          }}
          showTvSeries={showTvSeries}
          setShowTvSeries={(show) => {
            setShowTvSeries(show);
            setCurrentPage(1);
            setShouldSearch(true);
          }}
          showMovies={showMovies}
          setShowMovies={(show) => {
            setShowMovies(show);
            setCurrentPage(1);
            setShouldSearch(true);
          }}
          hideHentai={hideHentai}
          setHideHentai={(hide) => {
            setHideHentai(hide);
            setCurrentPage(1);
            setShouldSearch(true);
          }}
        />
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
                      border border-white/20 cursor-pointer flex flex-col  h-[22rem] sm:h-[22rem] md:h-[23rem] lg:h-[24rem] xl:h-[25rem] "
                      onClick={() => setSelectedAnime(anime)} // Open preview modal on card click
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
                      <div className="h-full  p-2 pt-2 pl-2 bg-black/20  backdrop-blur-sm border-t border-[#43b5a0]/20">
                        <h3 className="font-medium text-[#F2F5F7] line-clamp-2  text-lg group-hover:text-white 
                        transition-colors duration-200 w-full">
                          {anime.title}
                        </h3>
                        <div className="absolute flex items-center bottom-1 opacity-70 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-xs text-[#F2F5F7]/90 ">
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
  
          {/* Pagination section remains the same */}
          {totalPages > 1 && (
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
  
      {/* Preview Modal remains the same */}
      {selectedAnime && (
        <AnimePreview
          anime={selectedAnime}
          isOpen={!!selectedAnime}
          onClose={() => setSelectedAnime(null)}
        />
      )}
    </div>
  );
};

export default GenrePage;
