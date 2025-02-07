import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Slideshow } from '../components/Slideshow';
import { TopAnime } from '../components/TopAnime';
import { Schedule } from '../components/Schedule';
import { getNavigationState } from '../utils/navigationState';

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
  const [isTopAnimeLoading, setIsTopAnimeLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTopPage, setCurrentTopPage] = useState(() => {
    const savedState = getNavigationState();
    return (savedState?.source?.component === 'TopAnime' && savedState?.page) || 1;
  });
  const [currentSchedulePage, setCurrentSchedulePage] = useState(() => {
    const savedState = getNavigationState();
    return (savedState?.source?.component === 'Schedule' && savedState?.page) || 1;
  });
  const [topPagination, setTopPagination] = useState<PaginationData | null>(null);
  const [schedulePagination, setSchedulePagination] = useState<PaginationData | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const itemsPerPage = 10;

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const fetchTopAnime = async (page: number) => {
    setIsTopAnimeLoading(true);
    try {
      const response = await fetchFromAPI<any>('/top/anime', {
        page: page.toString(),
        limit: itemsPerPage.toString(),
        filter: 'bypopularity'
      });

      if (response?.data) {
        setTopAnime(response.data);
        setTopPagination(response.pagination || {
          current_page: 1,
          has_next_page: false,
          items: { count: 0, total: 0, per_page: itemsPerPage },
          last_visible_page: 1
        });
      } else {
        console.error('Invalid data format:', response);
        setError('Failed to load anime data');
      }
    } catch (error) {
      console.error('Error fetching top anime:', error);
      setError('Failed to load anime data');
    } finally {
      setIsTopAnimeLoading(false);
    }
  };

  const fetchSchedule = async (page: number) => {
    setIsScheduleLoading(true);
    try {
      const response = await fetchFromAPI<any>('/schedules', {
        filter: 'friday',
        page: page.toString(),
        limit: itemsPerPage.toString(),
        sfw: true
      });

      if (response?.data) {
        setSchedule(response.data);
        setSchedulePagination(response.pagination || {
          current_page: 1,
          has_next_page: false,
          items: { count: 0, total: 0, per_page: itemsPerPage },
          last_visible_page: 1
        });
      } else {
        console.error('Invalid schedule data:', response);
        setError('Failed to load schedule data');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule data');
    } finally {
      setIsScheduleLoading(false);
    }
  };

  useEffect(() => {
    const fetchTopAnimeData = async () => {
      setIsTopAnimeLoading(true);
      try {
        await fetchTopAnime(currentTopPage);
      } finally {
        setIsTopAnimeLoading(false);
      }
    };

    fetchTopAnimeData();
  }, [currentTopPage]);

  useEffect(() => {
    const fetchScheduleData = async () => {
      setIsScheduleLoading(true);
      try {
        await fetchSchedule(currentSchedulePage);
      } finally {
        setIsScheduleLoading(false);
      }
    };

    fetchScheduleData();
  }, [currentSchedulePage]);

  // Initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsTopAnimeLoading(true);
      setIsScheduleLoading(true);
      try {
        await Promise.all([
          fetchTopAnime(1),
          fetchSchedule(1)
        ]);
      } finally {
        setIsTopAnimeLoading(false);
        setIsScheduleLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  return (
    <>
      <Slideshow />
      <div className="py-8">
        <TopAnime 
          animeData={topAnime}
          pagination={topPagination}
          currentPage={currentTopPage}
          onPageChange={setCurrentTopPage}
          isLoading={isTopAnimeLoading}
        />
        <Schedule 
          scheduleData={schedule}
          pagination={schedulePagination}
          currentPage={currentSchedulePage}
          onPageChange={setCurrentSchedulePage}
          isLoading={isScheduleLoading}
        />
      </div>
    </>
  );
}

export default HomePage;
