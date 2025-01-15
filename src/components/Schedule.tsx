import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { fetchFromAPI } from '../utils/api';
import { AnimePreview } from './AnimePreview';
import { Pagination } from './Pagination';

interface PaginationData {
  has_next_page: boolean;
  last_visible_page: number;
  current_page: number;
}

export function Schedule() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [activeDay, setActiveDay] = useState(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    return days[today];
  });

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

  // Reset to page 1 when changing days
  useEffect(() => {
    setCurrentPage(1);
  }, [activeDay]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Airing Schedule</h2>
      
      {/* Day selector */}
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

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No anime scheduled for {activeDay}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {schedule.map((anime) => (
            <div key={anime.mal_id} className="relative group">
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
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </LazyLoad>
                    {anime.score && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        {anime.score}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2">{anime.title}</h3>
                  </div>
                </div>
              </Link>

              {/* Info Button */}
              <button
                className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-black/80"
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
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
