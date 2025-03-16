import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchFromAPI } from '../utils/api';

import Hero from '../components/Hero';
import { TopAnime } from '../components/TopAnime';
import { Schedule } from '../components/Schedule';
import TopMoviesCarousel from '../components/TopMoviesCarousel';
import { useAnimeStore } from '../store/animeStore';

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

interface PaginationData {
  current_page: number;
  has_next_page: boolean;
  items: { count: number; total: number; per_page: number };
  last_visible_page: number;
}

function HomePage() {
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [isTopAnimeLoading, setIsTopAnimeLoading] = useState(true);
  const { topAnimePage } = useAnimeStore();
  const [currentTopPage, setCurrentTopPage] = useState(topAnimePage);
  const [topPagination, setTopPagination] = useState<PaginationData | null>(null);

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
      }
    } catch (error) {
      console.error('Error fetching top anime:', error);
    } finally {
      setIsTopAnimeLoading(false);
    }
  };

  // Load initial data with persisted page number
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsTopAnimeLoading(true);
      try {
        await fetchTopAnime(currentTopPage);
      } finally {
        setIsTopAnimeLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Run only once on mount

  // Handle top anime page changes
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
        <Schedule />
        <div className="py-0">
          <TopMoviesCarousel />
        </div>
      </div>
    </>
  );
}

export default HomePage;
