import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';

import Hero from '../components/Hero';
import { TopAnime } from '../components/TopAnime';
import { Schedule } from '../components/Schedule';
import { getNavigationState } from '../utils/navigationState';
import TopMoviesCarousel from '../components/TopMoviesCarousel';
import Breadcrumbs from '../components/Breadcrumbs';
import ExplorePointer from '../components/ExplorePointer';

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

  const itemsPerPage = 10;

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
    } finally {
      setIsTopAnimeLoading(false);
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
      <Hero />
      
      <div className="relative backgroundMain">
      
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
        <div className="py-0">
      
        <TopMoviesCarousel />
          
        </div>
      </div>
      
      
    </>
  );
}

export default HomePage;
