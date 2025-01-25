import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Slideshow } from '../components/Slideshow';
import { TopAnime } from '../components/TopAnime';
import { Schedule } from '../components/Schedule';

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

function HomePage() {
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [schedule, setSchedule] = useState<ScheduleAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTopPage, setCurrentTopPage] = useState(1);
  const [currentSchedulePage, setCurrentSchedulePage] = useState(1);
  const [topPagination, setTopPagination] = useState<PaginationData | null>(null);
  const [schedulePagination, setSchedulePagination] = useState<PaginationData | null>(null);

  const itemsPerPage = 15;

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
    <>
      <Slideshow />
      <div className="py-8">
        <TopAnime 
          animeData={topAnime}
          pagination={topPagination}
          currentPage={currentTopPage}
          onPageChange={setCurrentTopPage}
          isLoading={isLoading}
        />
        <Schedule 
          scheduleData={schedule}
          pagination={schedulePagination}
          currentPage={currentSchedulePage}
          onPageChange={setCurrentSchedulePage}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}

export default HomePage;
