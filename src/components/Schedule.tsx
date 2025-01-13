import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from './LazyLoad';
import { Pagination } from './Pagination'; // Import the new Pagination component

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
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Upcoming Schedule</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
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

          {/* Pagination */}
          {pagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.last_visible_page}
              onPageChange={(page) => setCurrentPage(page)}
              isLoading={loading}
            />
          )}
        </>
      )}
    </div>
  );
}
