import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { Tooltip } from './ui/Tooltip';
import { Pagination } from './Pagination';
import { GenreFilter } from './ui/Filters/GenreFilter';
import { SearchBar } from './ui/Filters/SearchBar';
import { CloseButton } from './ui/Buttons/CloseButton';
import { StatusDropdown } from './ui/Buttons/StatusDropdown';
import { StatusFilter } from './ui/Filters/StatusFilter';

const ITEMS_PER_PAGE = 10;
const PLACEHOLDER_IMAGE = '/124145l.webp';

interface WatchlistAnime {
  id: number;
  anime_id: number;
  anime_title?: string;
  anime_image?: string;
  status?: 'planning' | 'watching' | 'completed' | 'dropped';
  genres?: { mal_id: number; name: string }[];
  created_at?: string;
  user_id?: string;
}

interface Genre {
  mal_id: number;
  name: string;
}

const MemoizedStatusDropdown = memo(StatusDropdown);
const MemoizedCloseButton = memo(CloseButton);

interface AnimeCardProps {
  anime: WatchlistAnime;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  imageLoadError: { [key: number]: boolean };
  handleImageError: (id: number) => void;
}

const AnimeCard = memo(({ anime, onStatusChange, onDelete, imageLoadError, handleImageError }: AnimeCardProps) => {
  return (
    <div className="relative w-full rounded-xl shadow-lg will-change-transform 
      hover:scale-105 border border-white/20 hover:border-[#fa448c]/40 cursor-pointer flex flex-col
      transition-[transform,border-color] duration-300 ease-out">
      <Link to={`/anime/${anime.anime_id}`}>
        <div className="relative rounded-t-xl overflow-hidden aspect-[3/4] w-full max-h-[20rem]">
          <img
            src={imageLoadError[anime.id] ? PLACEHOLDER_IMAGE : (anime.anime_image || PLACEHOLDER_IMAGE)}
            alt={anime.anime_title}
            className="w-full h-full object-cover will-change-transform"
            onError={() => handleImageError(anime.id)}
            loading="lazy"
          />
        </div>
      </Link>

      <div className="p-2 bg-black/20 border-t border-[#43b5a0]/20 h-[6.5rem] relative">
        <Link to={`/anime/${anime.anime_id}`}>
          <h4 className="font-medium text-[#F2F5F7] line-clamp-2 text-lg hover:text-white 
            transition-colors duration-200">
            {anime.anime_title}
          </h4>
        </Link>
        <div className="mt-1 absolute w-full bottom-0 left-0 pb-1 px-1">
          <MemoizedStatusDropdown
            className="w-full"
            animeId={anime.id}
            currentStatus={anime.status || 'planning'}
            onStatusChange={(newStatus) => onStatusChange(anime.id, newStatus)}
          />
        </div>
      </div>
      <MemoizedCloseButton animeId={anime.id} onDelete={() => onDelete(anime.id)} />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.anime.id === nextProps.anime.id &&
    prevProps.anime.status === nextProps.anime.status &&
    prevProps.imageLoadError[prevProps.anime.id] === nextProps.imageLoadError[nextProps.anime.id]
  );
});

const AnimeGrid = memo(({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 z-0">
    {children}
  </div>
));

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
  const [cachedData, setCachedData] = useState<{ [key: string]: WatchlistAnime[] }>({});
  const [cachedCounts, setCachedCounts] = useState<{ [key: string]: number }>({});
  const [imageLoadError, setImageLoadError] = useState<{ [key: number]: boolean }>({});

  const getCacheKey = useCallback((page: number) => {
    return `${page}-${selectedStatuses.join(',')}-${searchTerm}-${selectedGenres.map(g => g.mal_id).join(',')}`;
  }, [selectedStatuses, searchTerm, selectedGenres]);

  const handleImageError = (animeId: number) => {
    setImageLoadError(prev => ({ ...prev, [animeId]: true }));
  };

  const fetchWatchlist = useCallback(async (page: number) => {
    if (!user || !supabase) {
      setIsLoading(false);
      return;
    }

    const cacheKey = getCacheKey(page);
    
    if (cachedData[cacheKey] && cachedCounts[cacheKey] !== undefined) {
      setWatchlist(cachedData[cacheKey]);
      setTotalItems(cachedCounts[cacheKey]);
      setIsLoading(false);
      return;
    }

    try {
      setError('');
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      
      let query = supabase
        .from('anime_watchlist')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      if (selectedStatuses.length > 0) {
        query = query.in('status', selectedStatuses);
      }

      if (searchTerm) {
        query = query.ilike('anime_title', `%${searchTerm}%`);
      }

      if (selectedGenres.length > 0) {
        const genreIds = selectedGenres.map(g => g.mal_id);
        query = query.contains('genres', genreIds.map(id => ({ mal_id: id })));
      }

      const { data: watchlistData, error: watchlistError, count } = await query
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (watchlistError) throw watchlistError;

      if (watchlistData) {
        setCachedData(prev => ({ ...prev, [cacheKey]: watchlistData }));
        setCachedCounts(prev => ({ ...prev, [cacheKey]: count || 0 }));
        setWatchlist(watchlistData);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setError('Failed to load watchlist');
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, selectedStatuses, selectedGenres, searchTerm, getCacheKey]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','));
    if (searchTerm) params.set('search', searchTerm);
    setSearchParams(params);
  }, [currentPage, selectedStatuses, searchTerm, setSearchParams]);

  useEffect(() => {
    fetchWatchlist(currentPage);
  }, [fetchWatchlist, currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchWatchlist(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = useCallback((id: number, newStatus: string) => {
    if (!user || !supabase) return;

    const updateStatus = async () => {
      try {
        const { error } = await supabase
          .from('anime_watchlist')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) throw error;

        setWatchlist(prev => prev.map(anime => 
          anime.id === id ? { ...anime, status: newStatus as WatchlistAnime['status'] } : anime
        ));
      } catch (error) {
        console.error('Error updating status:', error);
      }
    };

    updateStatus();
  }, [user, supabase]);

  const handleDelete = useCallback((id: number) => {
    if (!user || !supabase) return;

    const deleteAnime = async () => {
      try {
        const { error: deleteError } = await supabase
          .from('anime_watchlist')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        setWatchlist(prev => prev.filter(item => item.id !== id));
        setTotalItems(prev => prev - 1);
        setCachedData({});
        setCachedCounts({});
      } catch (error) {
        console.error('Error deleting anime:', error);
        setError('Failed to delete anime');
      }
    };

    deleteAnime();
  }, [user, supabase, setCachedData, setCachedCounts]);

  const memoizedWatchlist = useMemo(() => watchlist, [watchlist]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 max-w-[100rem] space-y-6  px-4 sm:px-6 lg:px-8 backgroundMain">
        <div className="flex justify-between items-center  mx-auto py-12 max-w-[100rem] space-y-6  px-4 sm:px-6 lg:px-8 ">
          <h2 className="text-3xl font-bold text-[#F2F5F7] tracking-tight mt-12 p-2">
            <span className="bg-clip-text text-transparent text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6]">
              My Watchlist
            </span>
          </h2>
          <span className="text-sm font-medium text-[#F2F5F7] bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full mt-12">
            Loading...
          </span>
        </div>
        
        <div className="container mx-auto py-12 max-w-[100rem] space-y-6  px-4 sm:px-6 lg:px-8 backgroundMain">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 ">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="relative bg-black/20 rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="w-full aspect-[3/4] bg-gray-200/20" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200/20 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-[100rem] backgroundMain">
    {/* Header section */}
    <div className="flex flex-col md:flex-row md:justify-between items-center max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <h2 className="text-3xl text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] mt-24 md:mt-24 mb-4 md:mb-0 tilt-neon">
        <span className="bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6]">
          My Watchlist
        </span>
      </h2>
    </div>
  
    {/* Filters and Counter Row */}
    <div className="max-w-[100rem] px-4 sm:px-6 lg:px-8 mx-auto mb-6 mt-12">
      {/* Search Input - Full Width */}
      <div className="mb-4 w-full">
        <SearchBar
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
          handleSearch={handleSearch}
          isSearching={isLoading}
        />
      </div>
  
      {/* Status Filter and Total Counter in one row */}
      <div className="flex flex-row justify-between items-center w-full">
        <StatusFilter
          selectedStatuses={selectedStatuses}
          onStatusChange={setSelectedStatuses}
        />
        
        <div className="relative flex items-center sm:mt-0">
          <span className="bg-clip-text text-[#fd5454] drop-shadow-[0_2px_12px_#fd5454] tilt-neon2 px-4 py-2">
            Total in Watchlist: {totalItems}
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            xmlnsXlink="http://www.w3.org/1999/xlink" 
            viewBox="0 0 80 80"
            className="absolute -right-2 w-12 h-12 md:w-14 md:h-14 stroke-[#fd5454] drop-shadow-[0_0_8px_#fd5454] stroke-2 fill-none"
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
    </div>
  
    {error && (
      <div className="text-red-500 px-4 sm:px-6 lg:px-8 mx-auto max-w-[100rem] mb-4">{error}</div>
    )}
  
    <div className="max-w-[100rem] px-4 sm:px-6 lg:px-8 mx-auto pt-6">
      <AnimeGrid>
        {memoizedWatchlist.map((anime) => (
          <div key={anime.id} className="w-full">
            <LazyLoad>
              <AnimeCard
                anime={anime}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                imageLoadError={imageLoadError}
                handleImageError={handleImageError}
              />
            </LazyLoad>
          </div>
        ))}
      </AnimeGrid>
    </div>
  
    {totalItems > ITEMS_PER_PAGE && (
      <div className="mt-8 px-4 sm:px-6 lg:px-8 mx-auto max-w-[100rem] flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
          onPageChange={handlePageChange}
        />
      </div>
    )}
  </div>
  );
}