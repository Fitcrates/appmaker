import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
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
  score: number;
}

interface PaginationData {
  has_next_page: boolean;
  last_visible_page: number;
}

export function TopAnime() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredAnime, setHoveredAnime] = useState<any | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  const itemsPerPage = 10;

  const fetchTopAnime = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetchFromAPI<{ data: Anime[]; pagination: PaginationData }>(
        `/top/anime?page=${page}&limit=${itemsPerPage}`
      );
      setAnimeList(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching top anime:', error);
      setError('Failed to load top anime');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopAnime(currentPage);
  }, [currentPage]);

  const handleMouseEnter = (anime: any, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const previewWidth = 300; // Width of our preview component
    const previewHeight = 400; // Approximate height of preview
    const isMobile = screenWidth < 768; // Mobile breakpoint
    
    let x, y;
    
    if (isMobile) {
      // On mobile, center horizontally and position below the card
      x = Math.max(10, Math.min(screenWidth - previewWidth - 10, (screenWidth - previewWidth) / 2));
      y = Math.min(rect.bottom + 10, screenHeight - previewHeight - 10);
      
      // If there's not enough space below, show above
      if (y + previewHeight > screenHeight - 10) {
        y = Math.max(10, rect.top - previewHeight - 10);
      }
    } else {
      // Desktop positioning
      x = rect.right + 10;
      if (x + previewWidth + 20 > screenWidth) {
        x = rect.left - previewWidth - 10;
      }
      
      y = rect.top;
      if (y + previewHeight > screenHeight - 10) {
        y = screenHeight - previewHeight - 10;
      }
    }
    
    setPreviewPosition({ x, y });
    setHoveredAnime(anime);
  };

  const handleMouseLeave = () => {
    setHoveredAnime(null);
  };

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div id="top-anime" className="relative mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Top Anime</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${hoveredAnime ? 'blur-sm' : ''}`}>
          {animeList.map((anime) => (
            <Link
              key={anime.mal_id}
              to={`/anime/${anime.mal_id}`}
              className="relative group"
              onMouseEnter={(e) => handleMouseEnter(anime, e)}
              onMouseLeave={handleMouseLeave}
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
                  {anime.score && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm flex items-center">
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
          ))}
        </div>
      )}

      {/* Preview Popup */}
      {hoveredAnime && (
        <div
          className="fixed z-50 pointer-events-none animate-fade-in md:w-[300px] w-[calc(100%-20px)]"
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
            maxWidth: window.innerWidth < 768 ? 'calc(100vw - 20px)' : '300px'
          }}
        >
          <AnimePreview 
            anime={hoveredAnime} 
            className="shadow-2xl ring-1 ring-black/5 max-h-[80vh] overflow-y-auto" 
          />
        </div>
      )}

      {pagination && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.last_visible_page}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
}
