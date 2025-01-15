import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Star } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { AnimePreview } from '../components/AnimePreview';

interface Genre {
  mal_id: number;
  name: string;
  count: number;
}

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

interface GenreAnimeResponse {
  data: Anime[];
  pagination: {
    has_next_page: boolean;
    last_visible_page: number;
  };
}

export function GenrePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [genreLoading, setGenreLoading] = useState(true);
  const [topAnimeLoading, setTopAnimeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenresLoading, setIsGenresLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [hoveredAnime, setHoveredAnime] = useState<any | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [pagination, setPagination] = useState<{ has_next_page: boolean; last_visible_page: number } | null>(null);
  const initialMount = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const itemsPerPage = 25;

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch top anime on mount
  useEffect(() => {
    const fetchTopAnime = async () => {
      try {
        setTopAnimeLoading(true);
        const response = await fetchFromAPI<{ data: Anime[] }>('/top/anime', { limit: 5 }, RequestPriority.HIGH);
        if (response?.data) {
          setTopAnime(response.data);
        }
      } catch (err) {
        console.error('Error fetching top anime:', err);
      } finally {
        setTopAnimeLoading(false);
      }
    };
    fetchTopAnime();
  }, []);

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    if (isGenresLoading || genres.length > 0) return;
    
    setIsGenresLoading(true);
    try {
      const response = await fetchFromAPI<{ data: Genre[] }>('/genres/anime', {}, RequestPriority.HIGH);
      if (response?.data) {
        setGenres(response.data);
        // Select the first genre by default only on initial mount
        if (response.data.length > 0 && initialMount.current) {
          // setSelectedGenre(response.data[0]);
          initialMount.current = false;
        }
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
      setError('Failed to load genres');
    } finally {
      setIsGenresLoading(false);
    }
  }, [isGenresLoading, genres.length]);

  // Fetch anime for selected genre
  const fetchAnimeByGenre = useCallback(async () => {
    if (!selectedGenres.length) return;

    setGenreLoading(true);
    setError(null);
    try {
      const genres = selectedGenres.map(genre => genre.mal_id).join(',');
      const response = await fetchFromAPI<GenreAnimeResponse>(
        `/anime?genres=${genres}&page=${currentPage}&limit=${itemsPerPage}&order_by=score&sort=desc`,
        {},
        RequestPriority.MEDIUM
      );
      setAnimeList(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching anime:', err);
      setError('Failed to load anime');
    } finally {
      setGenreLoading(false);
    }
  }, [selectedGenres, currentPage]);

  // Initial genres fetch
  useEffect(() => {
    let ignore = false;
    
    const init = async () => {
      await fetchGenres();
      if (!ignore && initialMount.current) {
        initialMount.current = false;
      }
    };
    
    init();
    return () => {
      ignore = true;
    };
  }, [fetchGenres]);

  // Fetch anime when genre or page changes
  useEffect(() => {
    let ignore = false;
    
    const fetchData = async () => {
      await fetchAnimeByGenre();
    };
    
    if (!ignore) {
      fetchData();
    }
    
    return () => {
      ignore = true;
    };
  }, [fetchAnimeByGenre]);

  const handlePreviewClick = (anime: any, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isMobile) {
      const rect = event.currentTarget.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const previewWidth = 300;
      const previewHeight = 400;

      let x = rect.right + 10;
      if (x + previewWidth > screenWidth) {
        x = Math.max(10, rect.left - previewWidth - 10);
      }

      let y = Math.min(rect.top, screenHeight - previewHeight - 10);
      if (y < 10) y = 10;

      setPreviewPosition({ x, y });
      setHoveredAnime(anime);
    }
  };

  const handleTouchStart = (anime: any, event: React.TouchEvent) => {
    setTouchStartY(event.touches[0].clientY);
    setIsScrolling(false);
    
    const timer = setTimeout(() => {
      if (!isScrolling) {
        setHoveredAnime(anime);
      }
    }, 500);
    
    setTouchTimer(timer);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartY !== null) {
      const deltaY = Math.abs(event.touches[0].clientY - touchStartY);
      if (deltaY > 10) {
        setIsScrolling(true);
        if (touchTimer) {
          clearTimeout(touchTimer);
          setTouchTimer(null);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
    setTouchStartY(null);
  };

  const renderAnimeSection = (title: string, animeData: Anime[], isLoading: boolean) => (
    <div className="relative mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${hoveredAnime ? 'blur-sm' : ''}`}>
          {animeData.map((anime) => (
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
                  {anime.score && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {anime.score}
                    </div>
                  )}
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
      )}
    </div>
  );

  const handleMouseEnter = (anime: any, event: React.MouseEvent) => {
    if (!isMobile) {
      const rect = event.currentTarget.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const previewWidth = 300;
      const previewHeight = 400;

      let x = rect.right + 10;
      if (x + previewWidth > screenWidth) {
        x = Math.max(10, rect.left - previewWidth - 10);
      }

      let y = Math.min(rect.top, screenHeight - previewHeight - 10);
      if (y < 10) y = 10;

      setPreviewPosition({ x, y });
      setHoveredAnime(anime);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoveredAnime(null);
    }
  };

  const toggleGenre = (genre: Genre) => {
    setSelectedGenres(prev => {
      const isSelected = prev.some(g => g.mal_id === genre.mal_id);
      if (isSelected) {
        return prev.filter(g => g.mal_id !== genre.mal_id);
      } else {
        return [...prev, genre];
      }
    });
    setCurrentPage(1);
  };

  // Filter genres based on search term
  const filteredGenres = genres.filter(genre =>
    genre.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNavigate = (animeId: number) => {
    if (!hoveredAnime) {
      navigate(`/anime/${animeId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Top 5 Anime Section */}
        {renderAnimeSection('Top 5 Anime', topAnime, topAnimeLoading)}

        {/* Genre Selection */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Anime Genres</h1>
          
          {/* Dropdown Filter */}
          <div className="flex items-center justify-center" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full md:w-96 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-left flex justify-between items-center"
            >
              <span>
                {selectedGenres.length > 0
                  ? `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected`
                  : 'Select Genres'}
              </span>
              <span className="transform transition-transform duration-200">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full md:w-96 mt-2 bg-white rounded-lg shadow-lg">
                <div className="p-2 border-b sticky top-0 bg-white">
                  <input
                    type="search"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search genres..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <ul className="max-h-96 overflow-y-auto">
                  {filteredGenres.map((genre) => (
                    <li key={genre.mal_id}>
                      <button
                        onClick={() => toggleGenre(genre)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                          selectedGenres.some(g => g.mal_id === genre.mal_id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedGenres.some(g => g.mal_id === genre.mal_id) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        {genre.name}
                        <span className="text-sm text-gray-500 ml-auto">({genre.count})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Selected Genre Content */}
        {selectedGenres.length > 0 && (
          <>
            {renderAnimeSection(
              `Anime for ${selectedGenres.map(genre => genre.name).join(', ')}`,
              animeList,
              genreLoading
            )}
            
            {pagination && !genreLoading && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.last_visible_page}
                  onPageChange={setCurrentPage}
                  hasNextPage={pagination.has_next_page}
                />
              </div>
            )}
          </>
        )}

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
      </div>
    </div>
  );
}
