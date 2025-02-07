import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { fetchFromAPI } from '../utils/api';
import { AnimePreview } from './AnimePreview';
import { Pagination } from './Pagination';
import { useWatchlist } from '../hooks/useWatchlist';
import { Tooltip } from './ui/Tooltip';
import { Info, Bookmark } from 'lucide-react';

interface PaginationData {
  has_next_page: boolean;
  last_visible_page: number;
  current_page: number;
}

const getActiveDay = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date().getDay();
  return days[today];
};

export function Schedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [activeDay, setActiveDay] = useState(searchParams.get('day') || getActiveDay());
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [imageLoadError, setImageLoadError] = useState<{ [key: number]: boolean }>({});

  const itemsPerPage = 12;

  const days = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
  ];

  const SkeletonCard = () => (
    <div className="relative bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
      <div className="relative aspect-[3/4]">
        <div className="absolute inset-0 bg-gray-200" />
      </div>
      <div className="p-4 mt-8 h-28">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDaySelector = () => (
    <div className="flex overflow-x-auto gap-2 mb-6 pb-2 -mx-2 px-2">
      {days.map((day) => (
        <button
          key={day.id}
          onClick={() => setActiveDay(day.id)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeDay === day.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {day.label}
        </button>
      ))}
    </div>
  );

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        const response = await fetchFromAPI('/schedules', {
          filter: activeDay,
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sfw: 'true'
        });
        setSchedule(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [activeDay, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentPage !== 1) {
      params.set('page', currentPage.toString());
    } else {
      params.delete('page');
    }
    if (activeDay !== getActiveDay()) {
      params.set('day', activeDay);
    } else {
      params.delete('day');
    }
    setSearchParams(params);
  }, [currentPage, activeDay]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const day = searchParams.get('day') || getActiveDay();
    setCurrentPage(page);
    setActiveDay(day);
  }, [searchParams]);

  const handleImageError = (animeId: number) => {
    setImageLoadError(prev => ({ ...prev, [animeId]: true }));
  };

  if (isLoading) {
    return (
      <div className="px-4 lg:px-48">
        <h2 className="text-2xl font-bold mb-6">Airing Schedule</h2>
        {renderDaySelector()}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[...Array(12)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-12 lg:px-24 xl:px-48 mt-12 ">
      <h2 className="text-2xl font-bold mb-6">Airing Schedule</h2>
      
      {/* Day selector */}
      {renderDaySelector()}

      {isLoading ? (
        <div className="space-y-6 px-4 md:px-24 lg:px-48">
          {[...Array(12)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No anime scheduled for {activeDay}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {schedule.map((anime, index) => (
            <div key={`${activeDay}-${anime.mal_id}-${index}`} className="relative group">
              <Link
                to={`/anime/${anime.mal_id}`}
                className="block"
                onClick={(e) => {
                  if (selectedAnime) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl">
                  <div className="relative aspect-[3/4]">
                    <LazyLoad>
                      <img
                        src={imageLoadError[anime.mal_id] ? '/124145l.webp' : anime.images.jpg.image_url}
                        alt={anime.title}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                        onError={() => handleImageError(anime.mal_id)}
                        loading="lazy"
                      />
                    </LazyLoad>
                    {anime.score && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        {anime.score}
                      </div>
                    )}
                  </div>
                  <div className=" h-24 p-2">
                    <h3 className="font-medium text-sm line-clamp-2 mb-2 ">{anime.title}</h3>
                    {(anime.broadcast || anime.producers?.length > 0) && (
                      <div className="text-xs text-gray-600 space-y-1">
                        {anime.broadcast && (
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span>
                              {anime.broadcast.time ? (
                                <>
                                  {anime.broadcast.time} {anime.broadcast.timezone}
                                </>
                              ) : (
                                'Time TBA'
                              )}
                            </span>
                          </div>
                        )}
                        {anime.producers && anime.producers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                              <polyline points="17 2 12 7 7 2"/>
                            </svg>
                            <span className="line-clamp-1">
                              {anime.producers.map(producer => producer.name).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Watchlist Button */}
              <Tooltip content="Save to watchlist">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isInWatchlist[anime.mal_id] ? removeFromWatchlist(anime.mal_id) : addToWatchlist(anime);
                  }}
                  className="absolute top-2 right-12 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80"
                >
                  <Bookmark className={`w-4 h-4 ${isInWatchlist[anime.mal_id] ? 'fill-current' : 'fill-none'}`} />
                </button>
              </Tooltip>

              {/* Info Button */}
              <Tooltip content="Information">
                <button
                  className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-black/80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedAnime(anime);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedAnime(anime);
                  }}
                >
                  <Info className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && schedule.length > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.last_visible_page}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Preview Modal */}
      {selectedAnime && (
        <AnimePreview
          isOpen={!!selectedAnime}
          onClose={() => setSelectedAnime(null)}
          anime={selectedAnime}
        />
      )}
    </div>
  );
}
