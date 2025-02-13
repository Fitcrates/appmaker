import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
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
      <div className="space-y-6 px-4 md:px-24 lg:px-48">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-12 lg:px-24 xl:px-48 ">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Top Anime</h2>
        
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {animeData.map((anime) => (
          <div key={anime.mal_id} className="relative group">
            <LazyLoad>
              <div
                className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-105"
                onClick={() => setSelectedAnime(anime)}
              >
                <img
                  src={imageLoadError[anime.mal_id] ? '/124145l.webp' : anime.images.jpg.image_url}
                  alt={anime.title}
                  className="w-full h-80 object-cover transition-opacity duration-300"
                  onError={() => handleImageError(anime.mal_id)}
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 rounded-full px-2 py-1 flex items-center">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="ml-1 text-sm text-white">{anime.score}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-2 h-12">{anime.title}</h3>
                </div>
              </div>
            </LazyLoad>

            <div className="absolute top-2 right-2 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <Tooltip content="View Details">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnime(anime);
                    }}
                    className="p-2 bg-black rounded-full shadow-md"
                  >
                    <Info className="w-4 h-4 text-white" />
                  </button>
                </Tooltip>
                <Tooltip content={isInWatchlist[anime.mal_id] ? "Remove from Watchlist" : "Add to Watchlist"}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      isInWatchlist[anime.mal_id]
                        ? removeFromWatchlist(anime.mal_id)
                        : addToWatchlist(anime);
                    }}
                    className="p-2 bg-black rounded-full shadow-md"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isInWatchlist[anime.mal_id] ? "text-blue-500 fill-current" : "text-white"
                      }`}
                    />
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
      <Pagination
    currentPage={currentPage}
    totalPages={pagination?.last_visible_page || 1}
    onPageChange={onPageChange}
  />
    </div>
    
  );
}
