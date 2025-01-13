import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Slideshow } from '../components/Slideshow';

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
}

interface ScheduleAnime extends Anime {
  aired: {
    string: string;
  };
}

interface PaginationData {
  current_page: number;
  has_next_page: boolean;
  items: { count: number; total: number; per_page: number };
  last_visible_page: number;
}

export function HomePage() {
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [schedule, setSchedule] = useState<ScheduleAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTopPage, setCurrentTopPage] = useState(1);
  const [currentSchedulePage, setCurrentSchedulePage] = useState(1);
  const [topPagination, setTopPagination] = useState<PaginationData | null>(null);
  const [schedulePagination, setSchedulePagination] = useState<PaginationData | null>(null);

  const itemsPerPage = 25;

  const fetchTopAnime = async (page: number) => {
    try {
      const response = await fetchFromAPI<any>('/top/anime', {
        page: page.toString(),
        limit: itemsPerPage.toString(),
        filter: 'bypopularity'
      });

      if (response?.data) {
        setTopAnime(response.data);
        setTopPagination(response.pagination);
      } else {
        console.error('No data in top anime response:', response);
        setError('Failed to load top anime data');
      }
    } catch (error) {
      console.error('Error fetching top anime:', error);
      setError('Failed to load top anime. Please try again later.');
    }
  };

  const fetchSchedule = async (page: number) => {
    try {
      const response = await fetchFromAPI<any>('/seasons/now', {
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      if (response?.data) {
        setSchedule(response.data);
        setSchedulePagination(response.pagination);
      } else {
        console.error('No data in schedule response:', response);
        setError('Failed to load schedule data');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule. Please try again later.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchTopAnime(currentTopPage),
          fetchSchedule(currentSchedulePage)
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTopPage, currentSchedulePage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Slideshow />
      <div className="py-8">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : (
            <>
              {/* Top Anime Section */}
              <div id="top-anime" className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Top Anime</h2>
                  {topPagination && (
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        Page {currentTopPage} of {topPagination.last_visible_page}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentTopPage(prev => Math.max(1, prev - 1))}
                          disabled={currentTopPage === 1}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setCurrentTopPage(prev => Math.min(topPagination.last_visible_page, prev + 1))}
                          disabled={!topPagination.has_next_page}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {topAnime.map((anime) => (
                    <LazyLoad key={anime.mal_id}>
                      <Link
                        to={`/anime/${anime.mal_id}`}
                        className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <img
                          src={anime.images.jpg.image_url}
                          alt={anime.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-medium text-sm line-clamp-2">{anime.title}</h3>
                          <div className="mt-2 flex items-center text-sm text-gray-600">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{anime.score || 'N/A'}</span>
                          </div>
                        </div>
                      </Link>
                    </LazyLoad>
                  ))}
                </div>
              </div>

              {/* Upcoming Schedule Section */}
              <div id="schedule">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Upcoming Schedule</h2>
                  {schedulePagination && (
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        Page {currentSchedulePage} of {schedulePagination.last_visible_page}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentSchedulePage(prev => Math.max(1, prev - 1))}
                          disabled={currentSchedulePage === 1}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setCurrentSchedulePage(prev => Math.min(schedulePagination.last_visible_page, prev + 1))}
                          disabled={!schedulePagination.has_next_page}
                          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {schedule.map((anime) => (
                    <LazyLoad key={anime.mal_id}>
                      <Link
                        to={`/anime/${anime.mal_id}`}
                        className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <img
                          src={anime.images.jpg.image_url}
                          alt={anime.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-medium text-sm line-clamp-2">{anime.title}</h3>
                          <div className="mt-2 text-sm text-gray-600">
                            <div>{anime.aired?.string}</div>
                          </div>
                        </div>
                      </Link>
                    </LazyLoad>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}