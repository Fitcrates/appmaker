import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star, ArrowUpRight } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { AnimePreview } from './AnimePreview';
import { Pagination } from './Pagination';
import { useWatchlist } from '../hooks/useWatchlist';
import { Info, Bookmark } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { saveNavigationState, getNavigationState } from '../utils/navigationState';

interface PaginationData {
  has_next_page: boolean;
  last_visible_page: number;
  current_page: number;
}

interface TopAnimeProps {
  animeData: any[];
  pagination: PaginationData | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export function TopAnime({ animeData, pagination, currentPage, onPageChange, isLoading }: TopAnimeProps) {
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const location = useLocation();
  const [imageLoadError, setImageLoadError] = useState<{ [key: number]: boolean }>({});

  const handleImageError = (animeId: number) => {
    setImageLoadError(prev => ({ ...prev, [animeId]: true }));
  };

  // Initialize from saved state
  useEffect(() => {
    const savedState = getNavigationState();
    if (savedState?.source?.component === 'TopAnime' && savedState?.page) {
      onPageChange(savedState.page);
    }
  }, []);

  // Save state when page changes
  useEffect(() => {
    if (currentPage > 0) {  // Only save if page is valid
      saveNavigationState({
        pathname: location.pathname,
        search: location.search,
        page: currentPage,
        source: {
          component: 'TopAnime'
        }
      });
    }
  }, [currentPage, location.pathname, location.search]);

  const SkeletonCard = () => (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="w-full h-80 bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 md:px-24 lg:px-48 ">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <SkeletonCard key={index} />
          ))};
        </div>
      </div>
    );
  }

  return (
    <div id="topAnime" className="max-w-[100rem] space-y-6 mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-3xl font-bold text-[#F2F5F7] tracking-tight mt-24">
          <span className="bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon ">
            Top Anime
          </span>
        </h2>


        <div className="relative mt-24  flex items-center">
          <span className="bg-clip-text text-[#fd5454] drop-shadow-[0_2px_12px_#fd5454] tilt-neon2 px-4 py-2">
          Showing page {currentPage} of {pagination?.last_visible_page || 1}
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
        

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {animeData.map((anime) => (
          <div key={anime.mal_id} className="relative group">
            <LazyLoad>
              <div
                className="relative  rounded-xl shadow-lg overflow-hidden 
                transition-all duration-300 hover:scale-105 hover:shadow-xl 
                border border-white/20 hover:border-[#fa448c]/40 cursor-pointer flex flex-col"
                onClick={() => setSelectedAnime(anime)}
              >
                {/* Image Container */}
                <div className="relative rounded-t-xl overflow-t-hidden aspect-[3/4] max-h-[20rem]">
                  <img
                    src={imageLoadError[anime.mal_id] ? '/124145l.webp' : anime.images.jpg.image_url}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={() => handleImageError(anime.mal_id)}
                    loading="lazy"
                  />
                  
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center">
                    <Star className="w-4 h-4 text-[#F59E0B]" />
                    <span className="ml-1.5 text-sm font-mono text-white">{anime.score || '??'}</span>
                  </div>
                </div>
                
                {/* Title and Info area below the image */}
                <div className="p-2 bg-black/20 backdrop-blur-sm border-t border-[#43b5a0]/20">
                  <h3 className="font-medium text-[#F2F5F7] line-clamp-2 h-12 text-lg group-hover:text-white 
                  transition-colors duration-200 w-full">
                    {anime.title}
                  </h3>
                  <div className="flex items-center mt-2 opacity-70 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-xs text-[#F2F5F7]/90">
                      {anime.type || 'TV'} • {anime.episodes || '??'} eps
                    </span>
                    
                  </div>
                </div>
              </div>
            </LazyLoad>

            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="flex gap-2">
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
        ))}
      </div>

      {selectedAnime && (
        <AnimePreview
          anime={selectedAnime}
          isOpen={!!selectedAnime}
          onClose={() => setSelectedAnime(null)}
        />
      )}
      
      <div className="py-8">
        <Pagination
          currentPage={currentPage}
          totalPages={pagination?.last_visible_page || 1}
          onPageChange={onPageChange}
          className="flex justify-center"
        />
      </div>
    </div>
  );
}