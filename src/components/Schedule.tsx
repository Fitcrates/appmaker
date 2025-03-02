import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Star, Clock, Building2 } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { useAnimeData } from '../context/DataContext';
import { AnimePreview } from './AnimePreview';
import { Pagination } from './Pagination';
import { useWatchlist } from '../hooks/useWatchlist';
import { Tooltip } from './ui/Tooltip';
import { Info, Bookmark } from 'lucide-react';
import { fetchFromAPI, RequestPriority } from '../utils/api';

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
  const { scheduleData, isLoading } = useAnimeData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [activeDay, setActiveDay] = useState(searchParams.get('day') || getActiveDay());
  const [pagination, setPagination] = useState<PaginationData>({
    has_next_page: false,
    last_visible_page: 1,
    current_page: 1
  });
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const location = useLocation();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [imageLoadError, setImageLoadError] = useState<{ [key: number]: boolean }>({});

  const itemsPerPage = 10;

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
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
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
    <div className="flex flex-wrap   gap-2 mb-6 pb-2 px-1 sm:px-0  mt-6">
      {days.map((day) => (
        <button
          key={day.id}
          onClick={() => setActiveDay(day.id)}
          className={`px-4 py-2 mt-2 rounded-lg whitespace-nowrap transition-colors ${
            activeDay === day.id
              ? 'ring-2 ring-[#fa448c] shadow-lg shadow-[#fa448c]/50 inset-shadow text-white'
              : 'bg-black/10 backdrop-blur-sm ring-1 ring-white/30 text-white hover:bg-[#fa448c]'
          }`}
        >
          {day.label}
        </button>
      ))}
    </div>
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  useEffect(() => {
    const fetchScheduleData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetchFromAPI('/schedules', {
          filter: activeDay,
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sfw: 'true'
        }, RequestPriority.LOW);
        
        setSchedule(response.data);
        setPagination({
          has_next_page: response.pagination.has_next_page,
          last_visible_page: response.pagination.last_visible_page,
          current_page: response.pagination.current_page
        });
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchScheduleData();
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

  return (
    <div id="schedule" className="max-w-[100rem] space-y-6 mx-auto px-0 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center flex-wrap">
      <h2 className="font-bold text-[#F2F5F7] tracking-tight mt-12 w-auto sm:w-auto">
        <span className="bg-clip-text text-[#EC4899] drop-shadow-[0_0_8px_#fa448c] tilt-neon flex flex-wrap">
          Airing Schedule
        </span>
      </h2>
  
      <div className="relative mt-12 flex items-center">
        <span className="bg-clip-text text-[#fd5454] drop-shadow-[0_2px_12px_#fd5454] tilt-neon2 px-4 py-2">
          Page {currentPage} of {pagination?.last_visible_page || 1}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 80 80"
          className="absolute -right-0 sm:-right-2 w-14 h-14 stroke-[#fd5454] drop-shadow-[0_0_8px_#fd5454] stroke-2 fill-none"
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
  
        

      {renderDaySelector()}

      {isLoadingData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 tilt-neon">
          {[...Array(itemsPerPage)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center text-white/70 py-8 text-lg tilt-neon">
          No anime scheduled for {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {schedule.map((anime, index) => (
              <div key={`${activeDay}-${anime.mal_id}-${index}`} className="relative group">
                <LazyLoad>
                  <div
                    className="relative rounded-xl shadow-lg overflow-hidden 
                    transition-all duration-300 hover:scale-105 hover:shadow-xl 
                    border border-white/20 hover:border-[#fa448c]/40 cursor-pointer flex flex-col h-[23rem] sm:h-[28rem] "
                    onClick={() => setSelectedAnime(anime)}
                  >
                    {/* Image Container */}
                    <div className="relative rounded-t-xl overflow-t-hidden aspect-[3/4] max-h-[16rem] sm:max-h-[20rem]">
                      <img
                        src={imageLoadError[anime.mal_id] ? '/124145l.webp' : anime.images.jpg.image_url}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => handleImageError(anime.mal_id)}
                        loading="lazy"
                      />
                      
                      <div className="absolute top-3 left-1 sm:left-3 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center">
                        <Star className="w-4 h-4 text-[#F59E0B]" />
                        <span className="ml-1.5 text-sm font-mono text-white">{anime.score || '??'}</span>
                      </div>
                    </div>
                    
                    {/* Title and Info area below the image */}
                    <div className="h-full p-2 bg-black/20 backdrop-blur-sm border-t border-[#43b5a0]/20">
                      <h3 className="font-medium text-[#F2F5F7] line-clamp-2 text-lg group-hover:text-white 
                      transition-colors duration-200">
                        {anime.title}
                      </h3>
                      
                      <div className="mt-1 sm:mt-2 space-y-1.5">
                        {anime.broadcast && (
                          <div className="flex items-center gap-2 text-white/80">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">
                              {anime.broadcast.time ? 
                                `${anime.broadcast.time} ${anime.broadcast.timezone}` : 
                                'Time TBA'}
                            </span>
                          </div>
                        )}
                        
                        {anime.producers && anime.producers.length > 0 && (
                          <div className="flex items-center gap-2 text-white/80">
                            <Building2 className="w-4 h-4" />
                            <span className="text-xs line-clamp-1">
                              {anime.producers.map(producer => producer.name).join(', ')}
                            </span>
                          </div>
                        )}
                        
                       
                      </div>
                    </div>
                  </div>
                </LazyLoad>

                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
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
              onPageChange={handlePageChange}
              className="flex justify-center"
            />
          </div>

        </>
      )}
      
    </div>
    
  );
}