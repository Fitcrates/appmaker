import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from './LazyLoad';
import { Pagination } from './Pagination';
import { AnimePreview } from './AnimePreview';

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
  const [hoveredAnime, setHoveredAnime] = useState<any | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const navigate = useNavigate();

  const itemsPerPage = 15;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleMouseEnter = (anime: any, event: React.MouseEvent) => {
    if (!isMobile) {
      const rect = event.currentTarget.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const previewWidth = 300;
      const previewHeight = 400;
      
      let x = rect.right + 10;
      if (x + previewWidth + 20 > screenWidth) {
        x = rect.left - previewWidth - 10;
      }
      
      let y = rect.top;
      if (y + previewHeight > screenHeight - 10) {
        y = screenHeight - previewHeight - 10;
      }
      
      setPreviewPosition({ x, y });
      setHoveredAnime(anime);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoveredAnime(null);
    }
  };

  const handleNavigate = (animeId: number) => {
    if (!hoveredAnime) {
      navigate(`/anime/${animeId}`);
    }
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (isMobile) {
      event.preventDefault();
      setHoveredAnime(null);
    }
  };

  const handleTouchStart = (anime: any, event: React.TouchEvent) => {
    setTouchStartY(event.touches[0].clientY);
    const timer = setTimeout(() => {
      if (!isScrolling) {
        setHoveredAnime(anime);
        const rect = event.currentTarget.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const previewWidth = 300;
        const previewHeight = 400;
        
        const x = Math.max(10, Math.min(screenWidth - previewWidth - 10, (screenWidth - previewWidth) / 2));
        let y = Math.min(rect.bottom + 10, screenHeight - previewHeight - 10);
        
        if (y + previewHeight > screenHeight - 10) {
          y = Math.max(10, rect.top - previewHeight - 10);
        }
        
        setPreviewPosition({ x, y });
      }
    }, 500); // 500ms long press
    setTouchTimer(timer);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartY !== null) {
      const moveY = Math.abs(event.touches[0].clientY - touchStartY);
      if (moveY > 10) { // Threshold for detecting scroll
        setIsScrolling(true);
        if (touchTimer) {
          clearTimeout(touchTimer);
          setTouchTimer(null);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsScrolling(false);
    setTouchStartY(null);
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  };

  const handleClick = (animeId: number, event: React.MouseEvent) => {
    event.preventDefault();
    if (!hoveredAnime) {
      navigate(`/anime/${animeId}`);
    }
  };

  const handlePreviewClick = (anime: any, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHoveredAnime(anime);
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const previewWidth = 300;
    const previewHeight = 400;
    
    let x = rect.right + 10;
    if (x + previewWidth + 20 > screenWidth) {
      x = rect.left - previewWidth - 10;
    }
    
    let y = rect.top;
    if (y + previewHeight > screenHeight - 10) {
      y = screenHeight - previewHeight - 10;
    }
    
    setPreviewPosition({ x, y });
  };

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div id="schedule">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Upcoming Schedule</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="relative">
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${hoveredAnime ? 'blur-sm' : ''}`}>
            {schedule.map((anime) => (
              <Link
                key={anime.mal_id}
                to={`/anime/${anime.mal_id}`}
                className="relative group"
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl">
                  <div className="relative aspect-[3/4]">
                    <LazyLoad>
                      <img
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </LazyLoad>
                    {/* Preview trigger button */}
                    <button
                      className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                      onClick={(e) => handlePreviewClick(anime, e)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleTouchStart(anime, e);
                      }}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2">{anime.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Preview */}
          {hoveredAnime && (
            <div
              className="fixed z-50"
              style={{
                left: previewPosition.x,
                top: previewPosition.y,
                width: '300px',
              }}
            >
              <AnimePreview
                anime={hoveredAnime}
                onClose={() => setHoveredAnime(null)}
              />
            </div>
          )}

          {/* Backdrop for mobile */}
          {hoveredAnime && isMobile && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setHoveredAnime(null)}
            />
          )}

          {/* Pagination */}
          {pagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.last_visible_page}
              onPageChange={(page) => setCurrentPage(page)}
              isLoading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
