import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from './LazyLoad';

interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  aired?: {
    string: string;
  };
}

interface PaginationData {
  has_next_page: boolean;
  last_visible_page: number;
}

export function Schedule() {
  const [schedule, setSchedule] = useState<Anime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 25;

  const fetchSchedule = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetchFromAPI<{ data: Anime[]; pagination: PaginationData }>(
        `/seasons/now?page=${page}&limit=${itemsPerPage}`
      );
      setSchedule(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(currentPage);
  }, [currentPage]);

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div id="schedule">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Upcoming Schedule</h2>
        {pagination && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {pagination.last_visible_page}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.last_visible_page, prev + 1))}
                disabled={!pagination.has_next_page}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
