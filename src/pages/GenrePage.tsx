import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Star } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { AnimePreview } from '../components/AnimePreview';
import { AnimeCard } from '../components/AnimeCard';
import { useWatchlist } from '../hooks/useWatchlist';
import { Info, Bookmark, ChevronDown, X } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';

interface Genre {
  mal_id: number;
  name: string;
  count: number;
}

interface Creator {
  mal_id: number;
  name: string;
  given_name?: string;
  family_name?: string;
  about?: string;
  url: string;
}

interface Studio {
  mal_id: number;
  name: string;
  type: string;
  url: string;
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

function GenrePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<Creator[]>([]);
  const [creatorSearchTerm, setCreatorSearchTerm] = useState('');
  const [isCreatorDropdownOpen, setIsCreatorDropdownOpen] = useState(false);
  const [isCreatorsLoading, setIsCreatorsLoading] = useState(false);
  const creatorDropdownRef = useRef<HTMLDivElement>(null);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudios, setSelectedStudios] = useState<Studio[]>([]);
  const [studioSearchTerm, setStudioSearchTerm] = useState('');
  const [isStudioDropdownOpen, setIsStudioDropdownOpen] = useState(false);
  const [isStudiosLoading, setIsStudiosLoading] = useState(false);
  const studioDropdownRef = useRef<HTMLDivElement>(null);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [genreLoading, setGenreLoading] = useState(true);
  const [topAnimeLoading, setTopAnimeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenresLoading, setIsGenresLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
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

  // Handle click outside creator dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (creatorDropdownRef.current && !creatorDropdownRef.current.contains(event.target as Node)) {
        setIsCreatorDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle click outside studio dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (studioDropdownRef.current && !studioDropdownRef.current.contains(event.target as Node)) {
        setIsStudioDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      const response = await fetchFromAPI<{ data: Genre[] }>('/genres/anime');
      if (response?.data) {
        setGenres(response.data);
      }
    } catch (err) {
      console.error('Error fetching genres:', err);
    } finally {
      setIsGenresLoading(false);
    }
  }, [genres.length, isGenresLoading]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  // List of notable anime creators with their IDs
  const notableCreators = [
    { id: 1911, name: "Hideaki Anno", about: "Creator of Evangelion" },
    { id: 1117, name: "Hayao Miyazaki", about: "Co-founder of Studio Ghibli" },
    { id: 1938, name: "Yoshihiro Togashi", about: "Creator of Hunter x Hunter" },
    { id: 1867, name: "Eiichiro Oda", about: "Creator of One Piece" },
    { id: 1880, name: "Masashi Kishimoto", about: "Creator of Naruto" },
    { id: 2337, name: "Akira Toriyama", about: "Creator of Dragon Ball" },
    { id: 1879, name: "Tite Kubo", about: "Creator of Bleach" },
    { id: 2188, name: "Kentaro Miura", about: "Creator of Berserk" },
    { id: 1883, name: "Rumiko Takahashi", about: "Creator of InuYasha" },
    { id: 1877, name: "Tsugumi Ohba", about: "Creator of Death Note" },
    { id: 1878, name: "Takeshi Obata", about: "Artist of Death Note" },
    { id: 1881, name: "Hirohiko Araki", about: "Creator of JoJo's Bizarre Adventure" },
    { id: 1872, name: "Naoko Takeuchi", about: "Creator of Sailor Moon" },
    { id: 1868, name: "Hiromu Arakawa", about: "Creator of Fullmetal Alchemist" },
    { id: 2111, name: "Gen Urobuchi", about: "Creator of Madoka Magica, Fate/Zero" },
    { id: 1591, name: "Shinichiro Watanabe", about: "Director of Cowboy Bebop" },
    { id: 5111, name: "Makoto Shinkai", about: "Creator of Your Name" },
    { id: 2009, name: "Satoshi Kon", about: "Director of Perfect Blue" },
    { id: 1870, name: "Osamu Tezuka", about: "Creator of Astro Boy" },
    { id: 1875, name: "Go Nagai", about: "Creator of Mazinger Z" }
  ];

  // List of major anime studios with their IDs
  const majorStudios = [
    { id: 1, name: "Sunrise", about: "Known for Gundam series" },
    { id: 2, name: "Kyoto Animation", about: "Known for K-On!, Violet Evergarden" },
    { id: 4, name: "Bones", about: "Known for My Hero Academia" },
    { id: 7, name: "J.C.Staff", about: "Known for Toradora!" },
    { id: 11, name: "Madhouse", about: "Known for Death Note, One Punch Man S1" },
    { id: 14, name: "Toei Animation", about: "Known for Dragon Ball, One Piece" },
    { id: 17, name: "ufotable", about: "Known for Demon Slayer" },
    { id: 21, name: "Studio Ghibli", about: "Known for Spirited Away" },
    { id: 43, name: "Production I.G", about: "Known for Ghost in the Shell" },
    { id: 44, name: "Shaft", about: "Known for Monogatari Series" },
    { id: 53, name: "A-1 Pictures", about: "Known for Sword Art Online" },
    { id: 287, name: "David Production", about: "Known for JoJo's Bizarre Adventure" },
    { id: 456, name: "MAPPA", about: "Known for Jujutsu Kaisen" },
    { id: 858, name: "White Fox", about: "Known for Steins;Gate, Re:Zero" },
    { id: 803, name: "Trigger", about: "Known for Kill la Kill" },
    { id: 1835, name: "Studio WIT", about: "Known for Attack on Titan S1-S3" },
    { id: 569, name: "SILVER LINK.", about: "Known for Non Non Biyori" },
    { id: 291, name: "Brain's Base", about: "Known for Durarara!!" },
    { id: 121, name: "Sunrise", about: "Known for Code Geass" },
    { id: 73, name: "P.A. Works", about: "Known for Angel Beats!" }
  ];

  // Fetch creators with search
  const fetchCreators = useCallback(async (searchTerm: string = '') => {
    if (isCreatorsLoading) return;
    
    setIsCreatorsLoading(true);
    try {
      if (!searchTerm) {
        // Use predefined list if no search term
        setCreators(notableCreators.map(c => ({
          mal_id: c.id,
          name: c.name,
          about: c.about,
          url: `https://myanimelist.net/people/${c.id}`
        })));
      } else {
        // Search for creators using the API
        const response = await fetchFromAPI<any>('/people', {
          q: searchTerm,
          limit: 10,
          order_by: 'favorites',
          sort: 'desc'
        });
        
        if (response?.data) {
          const searchResults = response.data.map((person: any) => ({
            mal_id: person.mal_id,
            name: person.name,
            about: `Known for: ${person.favorites} favorites`,
            url: person.url
          }));
          setCreators([...searchResults]);
        }
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
    } finally {
      setIsCreatorsLoading(false);
    }
  }, [isCreatorsLoading]);

  // Fetch studios with search
  const fetchStudios = useCallback(async (searchTerm: string = '') => {
    if (isStudiosLoading) return;
    
    setIsStudiosLoading(true);
    try {
      if (!searchTerm) {
        // Use predefined list if no search term
        setStudios(majorStudios.map(s => ({
          mal_id: s.id,
          name: s.name,
          type: "anime",
          url: `https://myanimelist.net/anime/producer/${s.id}`
        })));
      } else {
        // Search for studios using the API
        const response = await fetchFromAPI<any>('/producers', {
          q: searchTerm,
          limit: 10,
          order_by: 'favorites',
          sort: 'desc'
        });
        
        if (response?.data) {
          const searchResults = response.data.map((studio: any) => ({
            mal_id: studio.mal_id,
            name: studio.name,
            type: studio.type,
            url: studio.url
          }));
          setStudios([...searchResults]);
        }
      }
    } catch (err) {
      console.error('Error fetching studios:', err);
    } finally {
      setIsStudiosLoading(false);
    }
  }, [isStudiosLoading]);

  // Debounced search handlers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (creatorSearchTerm) {
        fetchCreators(creatorSearchTerm);
      } else {
        fetchCreators();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [creatorSearchTerm, fetchCreators]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (studioSearchTerm) {
        fetchStudios(studioSearchTerm);
      } else {
        fetchStudios();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [studioSearchTerm, fetchStudios]);

  // Handle genre selection
  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenres(prev => {
      const isSelected = prev.some(g => g.mal_id === genre.mal_id);
      if (isSelected) {
        return prev.filter(g => g.mal_id !== genre.mal_id);
      } else {
        return [...prev, genre];
      }
    });
  };

  const renderAnimeSection = (title: string, animeData: Anime[], isLoading: boolean, sectionId: string) => (
    <div className="relative mb-12">
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : animeData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {animeData.map((anime) => (
            <Link
              to={`/anime/${anime.mal_id}`}
              key={anime.mal_id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="relative pb-[140%]">
                <img
                  src={anime.images?.jpg?.image_url || anime.images?.webp?.image_url || '/placeholder.jpg'}
                  alt={anime.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{anime.title}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span>{anime.score || 'N/A'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">No anime found</div>
      )}
    </div>
  );

  // Fetch anime for selected genres
  useEffect(() => {
    const fetchAnimeForGenres = async () => {
      if (selectedGenres.length === 0 && selectedCreators.length === 0 && selectedStudios.length === 0) {
        setAnimeList([]);
        setPagination(null);
        return;
      }

      setGenreLoading(true);
      try {
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          order_by: 'score',
          sort: 'desc'
        };

        if (selectedGenres.length > 0) {
          params.genres = selectedGenres.map(g => g.mal_id).join(',');
        }

        if (selectedStudios.length > 0) {
          params.producers = selectedStudios.map(s => s.mal_id).join(',');
        }

        // For creators, we need to fetch their anime lists and merge them
        let animeResponse;
        if (selectedCreators.length > 0) {
          // Fetch anime for each creator and combine results
          const creatorAnimePromises = selectedCreators.map(creator =>
            fetchFromAPI<any>(`/people/${creator.mal_id}/anime`)
          );
          
          const creatorResponses = await Promise.all(creatorAnimePromises);
          
          // Combine and deduplicate anime from all creators
          const combinedAnime = creatorResponses.flatMap(response => {
            // Ensure we're getting the anime array from the correct path in the response
            const animeList = response?.data || [];
            return animeList.map((item: any) => ({
              ...item.anime,
              images: item.anime?.images || {}
            }));
          });
          
          const uniqueAnime = Array.from(new Map(combinedAnime.map(anime => [anime.mal_id, anime])).values());
          
          animeResponse = {
            data: uniqueAnime,
            pagination: {
              has_next_page: false,
              last_visible_page: 1
            }
          };
        } else {
          animeResponse = await fetchFromAPI<GenreAnimeResponse>('/anime', params);
        }
        
        if (animeResponse?.data) {
          setAnimeList(animeResponse.data);
          setPagination(animeResponse.pagination);
        }
      } catch (err) {
        console.error('Error fetching anime:', err);
        setError('Failed to load anime');
      } finally {
        setGenreLoading(false);
      }
    };

    if (!initialMount.current) {
      fetchAnimeForGenres();
    } else {
      initialMount.current = false;
    }
  }, [selectedGenres, selectedCreators, selectedStudios, currentPage]);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Top 5 Anime Section */}
        {renderAnimeSection('Top 5 Anime', topAnime, topAnimeLoading, 'top')}

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Genre Filter */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 min-w-[200px]"
            >
              {selectedGenres.length > 0 ? `${selectedGenres.length} genres selected` : 'Filter by genre'}
              <ChevronDown className="h-4 w-4 ml-auto" />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border">
                <div className="p-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search genres..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {isGenresLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : filteredGenres.length > 0 ? (
                    filteredGenres.map((genre) => (
                      <label
                        key={genre.mal_id}
                        className="flex items-start px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGenres.some((g) => g.mal_id === genre.mal_id)}
                          onChange={() => handleGenreSelect(genre)}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium">{genre.name}</div>
                          {genre.count && (
                            <div className="text-sm text-gray-500">{genre.count} anime</div>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No genres found</div>
                  )}
                </div>
                {selectedGenres.length > 0 && (
                  <div className="p-2 border-t">
                    <button
                      onClick={() => setSelectedGenres([])}
                      className="w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Clear Selection ({selectedGenres.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Creator Filter */}
          <div className="relative" ref={creatorDropdownRef}>
            <button
              onClick={() => setIsCreatorDropdownOpen(!isCreatorDropdownOpen)}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 min-w-[200px]"
            >
              {selectedCreators.length > 0 ? `${selectedCreators.length} creators selected` : 'Filter by creator'}
              <ChevronDown className="h-4 w-4 ml-auto" />
            </button>

            {isCreatorDropdownOpen && (
              <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border">
                <div className="p-2">
                  <input
                    type="text"
                    value={creatorSearchTerm}
                    onChange={(e) => setCreatorSearchTerm(e.target.value)}
                    placeholder="Search creators..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {creatorSearchTerm && (
                    <div className="mt-1 text-xs text-gray-500">
                      Type to search all creators on MyAnimeList
                    </div>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {isCreatorsLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : creators.length > 0 ? (
                    creators.map(creator => (
                      <label
                        key={creator.mal_id}
                        className="flex items-start px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCreators.some(c => c.mal_id === creator.mal_id)}
                          onChange={() => {
                            setSelectedCreators(prev => {
                              const isSelected = prev.some(c => c.mal_id === creator.mal_id);
                              if (isSelected) {
                                return prev.filter(c => c.mal_id !== creator.mal_id);
                              } else {
                                return [...prev, creator];
                              }
                            });
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium">{creator.name}</div>
                          {creator.about && (
                            <div className="text-sm text-gray-500">{creator.about}</div>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No creators found</div>
                  )}
                </div>
                {selectedCreators.length > 0 && (
                  <div className="p-2 border-t">
                    <button
                      onClick={() => setSelectedCreators([])}
                      className="w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Clear Selection ({selectedCreators.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Studio Filter */}
          <div className="relative" ref={studioDropdownRef}>
            <button
              onClick={() => setIsStudioDropdownOpen(!isStudioDropdownOpen)}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 min-w-[200px]"
            >
              {selectedStudios.length > 0 ? `${selectedStudios.length} studios selected` : 'Filter by studio'}
              <ChevronDown className="h-4 w-4 ml-auto" />
            </button>

            {isStudioDropdownOpen && (
              <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border">
                <div className="p-2">
                  <input
                    type="text"
                    value={studioSearchTerm}
                    onChange={(e) => setStudioSearchTerm(e.target.value)}
                    placeholder="Search studios..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {studioSearchTerm && (
                    <div className="mt-1 text-xs text-gray-500">
                      Type to search all studios on MyAnimeList
                    </div>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {isStudiosLoading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : studios.length > 0 ? (
                    studios.map(studio => (
                      <label
                        key={studio.mal_id}
                        className="flex items-start px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudios.some(s => s.mal_id === studio.mal_id)}
                          onChange={() => {
                            setSelectedStudios(prev => {
                              const isSelected = prev.some(s => s.mal_id === studio.mal_id);
                              if (isSelected) {
                                return prev.filter(s => s.mal_id !== studio.mal_id);
                              } else {
                                return [...prev, studio];
                              }
                            });
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium">{studio.name}</div>
                          {majorStudios.find(s => s.id === studio.mal_id)?.about && (
                            <div className="text-sm text-gray-500">
                              {majorStudios.find(s => s.id === studio.mal_id)?.about}
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No studios found</div>
                  )}
                </div>
                {selectedStudios.length > 0 && (
                  <div className="p-2 border-t">
                    <button
                      onClick={() => setSelectedStudios([])}
                      className="w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Clear Selection ({selectedStudios.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Content */}
        {(selectedGenres.length > 0 || selectedCreators.length > 0 || selectedStudios.length > 0) && (
          <>
            {renderAnimeSection(
              `${selectedGenres.length > 0 ? `Anime for ${selectedGenres.map(genre => genre.name).join(', ')}` : ''} 
               ${selectedCreators.length > 0 ? `by ${selectedCreators.map(c => c.name).join(', ')}` : ''} 
               ${selectedStudios.length > 0 ? `from ${selectedStudios.map(s => s.name).join(', ')}` : ''}`.trim(),
              animeList,
              genreLoading,
              'genre'
            )}
            {pagination && pagination.has_next_page && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={genreLoading}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        {selectedAnime && (
          <AnimePreview
            isOpen={!!selectedAnime}
            onClose={() => setSelectedAnime(null)}
            anime={selectedAnime}
          />
        )}
      </div>
    </div>
  );
}

export default GenrePage;
