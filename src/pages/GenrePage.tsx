import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Pagination } from '../components/Pagination';
import { Star, Search, ChevronDown, ArrowDown, ChevronLeft, ChevronRight, Bookmark, Info, X } from 'lucide-react';
import { AnimeCard } from '../components/AnimeCard';
import { Tooltip } from '../components/ui/Tooltip';
import { saveNavigationState, getNavigationState } from '../utils/navigationState';
import { Footer } from '../components/Footer';
import { useWatchlist } from '../hooks/useWatchlist';
import { AnimePreview } from '../components/AnimePreview';

interface Genre {
  mal_id: number;
  name: string;
  count: number;
}

interface SearchResult {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string } };
  score: number;
  type: string;
  episodes: number;
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [genreLoading, setGenreLoading] = useState(true);
  const [topAnimeLoading, setTopAnimeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenresLoading, setIsGenresLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const initialMount = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [itemsPerPage] = useState(25);

  // Scroll to top when component mounts or location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
      // Always start with the predefined list
      const baseCreators = notableCreators.map(c => ({
        mal_id: c.id,
        name: c.name,
        about: c.about,
        url: `https://myanimelist.net/people/${c.id}`
      }));

      if (!searchTerm) {
        setCreators(baseCreators);
        return;
      }

      // Filter the predefined list first
      const searchTermLower = searchTerm.toLowerCase();
      const filteredCreators = baseCreators.filter(creator => 
        creator.name.toLowerCase().includes(searchTermLower)
      );

      // If we have matches in our predefined list, use those
      if (filteredCreators.length > 0) {
        setCreators(filteredCreators);
      } else {
        // Otherwise, search the API
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
            about: person.about || `Known for: ${person.favorites} favorites`,
            url: person.url
          }));
          setCreators(searchResults);
        }
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
      // On error, show the predefined list filtered by search term
      const filteredCreators = notableCreators
        .filter(c => c.name.toLowerCase().includes(creatorSearchTerm.toLowerCase()))
        .map(c => ({
          mal_id: c.id,
          name: c.name,
          about: c.about,
          url: `https://myanimelist.net/people/${c.id}`
        }));
      setCreators(filteredCreators);
    } finally {
      setIsCreatorsLoading(false);
    }
  }, [isCreatorsLoading, creatorSearchTerm]);

  // Debounced creator search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCreators(creatorSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [creatorSearchTerm, fetchCreators]);

  // Handle creator selection
  const handleCreatorSelect = useCallback((creator: Creator) => {
    setSelectedCreators(prev => {
      const isSelected = prev.some(c => c.mal_id === creator.mal_id);
      if (isSelected) {
        return prev.filter(c => c.mal_id !== creator.mal_id);
      } else {
        return [...prev, creator];
      }
    });
    setCurrentPage(1);
  }, []);

  // Toggle genre selection
  const toggleGenre = useCallback((genre: Genre) => {
    setSelectedGenres(prev => {
      const isSelected = prev.some(g => g.mal_id === genre.mal_id);
      if (isSelected) {
        return prev.filter(g => g.mal_id !== genre.mal_id);
      } else {
        return [...prev, genre];
      }
    });
    setCurrentPage(1);
  }, []);

  // Fetch studios with search
  const fetchStudios = useCallback(async (searchTerm: string = '') => {
    if (isStudiosLoading) return;
    
    setIsStudiosLoading(true);
    try {
      // Always start with the predefined list
      const baseStudios = majorStudios.map(s => ({
        mal_id: s.id,
        name: s.name,
        type: "anime",
        url: `https://myanimelist.net/anime/producer/${s.id}`
      }));

      if (!searchTerm) {
        setStudios(baseStudios);
        setIsStudiosLoading(false);
        return;
      }

      // Filter the predefined list first
      const searchTermLower = searchTerm.toLowerCase();
      const filteredStudios = baseStudios.filter(studio => 
        studio.name.toLowerCase().includes(searchTermLower)
      );

      // Only make an API call if we don't have enough local matches
      // and the search term is at least 3 characters long
      if (filteredStudios.length < 5 && searchTerm.length >= 3) {
        try {
          const response = await fetchFromAPI<any>('/producers', {
            q: searchTerm,
            limit: 10,
            order_by: 'count',
            sort: 'desc'
          });
          
          if (response?.data) {
            const apiResults = response.data.map((studio: any) => ({
              mal_id: studio.mal_id,
              name: studio.titles?.[0]?.title || studio.name,
              type: "anime",
              url: studio.url
            }));
            setStudios(apiResults);
          }
        } catch (err) {
          console.error('Error fetching studios from API:', err);
          // If API fails, still show local results
          setStudios(filteredStudios);
        }
      } else {
        // If we have enough local matches or search term is too short, just use those
        setStudios(filteredStudios);
      }
    } catch (err) {
      console.error('Error in fetchStudios:', err);
      // Reset to predefined list on error
      setStudios(majorStudios.map(s => ({
        mal_id: s.id,
        name: s.name,
        type: "anime",
        url: `https://myanimelist.net/anime/producer/${s.id}`
      })));
    } finally {
      setIsStudiosLoading(false);
    }
  }, [isStudiosLoading]);

  // Debounced studio search with longer delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studioSearchTerm !== '') {
        fetchStudios(studioSearchTerm);
      } else {
        // If search term is empty, just show the predefined list
        const baseStudios = majorStudios.map(s => ({
          mal_id: s.id,
          name: s.name,
          type: "anime",
          url: `https://myanimelist.net/anime/producer/${s.id}`
        }));
        setStudios(baseStudios);
      }
    }, 800); // Increased debounce time

    return () => clearTimeout(timer);
  }, [studioSearchTerm, fetchStudios]);

  // Handle studio selection
  const handleStudioSelect = useCallback((studio: Studio) => {
    setSelectedStudios(prev => {
      const isSelected = prev.some(s => s.mal_id === studio.mal_id);
      if (isSelected) {
        return prev.filter(s => s.mal_id !== studio.mal_id);
      } else {
        return [...prev, studio];
      }
    });
  }, []);

  // Fetch anime for selected genres
  const fetchAnimeForGenres = useCallback(async () => {
    if (selectedGenres.length === 0 && selectedCreators.length === 0 && selectedStudios.length === 0) {
      setAnimeList([]);
      setTotalPages(1);
      setHasNextPage(false);
      setGenreLoading(false);
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
        setTotalPages(animeResponse.pagination.last_visible_page);
        setHasNextPage(animeResponse.pagination.has_next_page);
      }
    } catch (err) {
      console.error('Error fetching anime:', err);
      setError('Failed to load anime');
    } finally {
      setGenreLoading(false);
    }
  }, [selectedGenres, selectedCreators, selectedStudios, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (!initialMount.current) {
      fetchAnimeForGenres();
    } else {
      initialMount.current = false;
    }
  }, [fetchAnimeForGenres]);

  const handleSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) {
      setAnimeList([]);
      return;
    }
    
    setIsSearching(true);
    setGenreLoading(true);
    try {
      const response = await fetchFromAPI<GenreAnimeResponse>('/anime', {
        q: searchQuery,
        page: page.toString(),
        limit: itemsPerPage.toString(),
        sfw: 'true',
        ...(selectedGenres.length > 0 && { genres: selectedGenres.map(g => g.mal_id).join(',') }),
        ...(selectedStudios.length > 0 && { producers: selectedStudios.map(s => s.mal_id).join(',') })
      });
      
      if (response?.data) {
        setAnimeList(response.data);
        setTotalPages(response.pagination.last_visible_page);
        setHasNextPage(response.pagination.has_next_page);
        setCurrentPage(page);
      } else {
        setAnimeList([]);
        setError('No results found.');
      }
    } catch (error) {
      console.error('Error searching anime:', error);
      setAnimeList([]);
      setError('Failed to perform search.');
    } finally {
      setIsSearching(false);
      setGenreLoading(false);
    }
  };

  // Filter genres based on search term
  const filteredGenres = genres.filter(genre =>
    genre.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentPage !== 1) {
      params.set('page', currentPage.toString());
    } else {
      params.delete('page');
    }
    if (selectedGenres.length > 0) {
      params.set('genres', selectedGenres.map(g => g.mal_id).join(','));
    } else {
      params.delete('genres');
    }
    if (selectedCreators.length > 0) {
      params.set('creators', selectedCreators.map(c => c.mal_id).join(','));
    } else {
      params.delete('creators');
    }
    if (selectedStudios.length > 0) {
      params.set('studios', selectedStudios.map(s => s.mal_id).join(','));
    } else {
      params.delete('studios');
    }
    setSearchParams(params);
  }, [currentPage, selectedGenres, selectedCreators, selectedStudios]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const genreIds = searchParams.get('genres');
    const creatorIds = searchParams.get('creators');
    const studioIds = searchParams.get('studios');
    setCurrentPage(page);
    if (genreIds && genres.length > 0) {
      const selectedGenres = genreIds.split(',').map(id => parseInt(id)).map(id => genres.find(g => g.mal_id === id));
      setSelectedGenres(selectedGenres.filter(Boolean));
    }
    if (creatorIds && creators.length > 0) {
      const selectedCreators = creatorIds.split(',').map(id => parseInt(id)).map(id => creators.find(c => c.mal_id === id));
      setSelectedCreators(selectedCreators.filter(Boolean));
    }
    if (studioIds && studios.length > 0) {
      const selectedStudios = studioIds.split(',').map(id => parseInt(id)).map(id => studios.find(s => s.mal_id === id));
      setSelectedStudios(selectedStudios.filter(Boolean));
    }
  }, [searchParams, genres, creators, studios]);

  const handleInfoClick = (anime: Anime) => {
    setSelectedAnime(anime);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedAnime(null);
  };

  const renderAnimeSection = (title: string, animeData: Anime[], isLoading: boolean, sectionId: string) => (
    <div className="relative mb-12 px-4">
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : searchQuery.trim() === '' && selectedGenres.length === 0 && selectedCreators.length === 0 && selectedStudios.length === 0 ? (
        <div className="text-center text-gray-500 py-12 min-h-[40vh]">
          <p className="text-lg mb-2">Start exploring anime</p>
          <p className="text-sm">Use the search bar  to find specific anime or use filters to discover by genres, creators, or studios</p>
        </div>
      ) : animeData.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {animeData.map((anime) => (
            <div key={anime.mal_id} className="relative group">
              <Link
                to={`/anime/${anime.mal_id}`}
                className="block"
                onClick={(e) => {
                  if (selectedAnime) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl">
                  <div className="relative h-80">
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
                  </div>
                  <div className="p-4 h-12 mb-6">
                    <h3 className="font-medium text-sm line-clamp-2">{anime.title}</h3>
                  </div>
                </div>
              </Link>

              {/* Watchlist Button */}
              <Tooltip content="Save to watchlist">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isInWatchlist[anime.mal_id] ? removeFromWatchlist(anime.mal_id) : addToWatchlist(anime);
                  }}
                  className="absolute top-2 right-12 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80"
                >
                  <Bookmark className={`w-4 h-4 ${isInWatchlist[anime.mal_id] ? 'fill-current' : 'fill-none'}`} />
                </button>
              </Tooltip>

              {/* Info Button */}
              <Tooltip content="Information">
                <button
                  className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-black/80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInfoClick(anime);
                  }}
                >
                  <Info className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          {searchQuery.trim() ? 
            <p>No anime found matching your search criteria</p> :
            <p>No anime found matching your filter criteria</p>
          }
        </div>
      )}
    </div>
  );

  return (
    <main className="relative w-full overflow-hidden">
      {/* Hero Section */}
      <section className="hero-section fixed top-0 left-0 w-full h-screen flex items-end pb-20 z-0">
        {/* Background Video */}
        <div className="absolute inset-0 flex items-center justify-center w-full h-full">
          <video
            className="w-full h-full object-cover"
            src="media/mylivewallpapers-com-Gohan-Dragon-Ball-Z-4K.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
  {/* Hero Content */}
<div className="max-w-7xl mx-auto w-full flex flex-col justify-end  px-4 sm:px-6 lg:px-8 h-full relative z-10">
  <div className="flex flex-col lg:flex-row justify-between  items-center w-full">
    {/* Text + Arrow Container */}
    <div className="flex flex-col items-center text-center   space-x-24 lg:space-x-48 lg:items-start lg:text-left lg:flex-row lg:w-auto">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl sm:text-7xl md:text-8xl font-light text-white tracking-tight leading-none mb-4"
        >
          Discover Anime
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-white/80"
        >
          Explore your favorite genres and find new series to watch
        </motion.p>
      </div>

      {/* Scroll Arrow */}
      <motion.button
        onClick={() => {
          document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' });
        }}
        whileHover={{ scale: 1.1 }}
        className="text-white justify-end hover:text-blue-400 transition-colors  lg:mt-0 lg:ml-6"
        aria-label="Scroll to content"
      >
        <ArrowDown className="w-24 h-24 mt-8" />
      </motion.button>
    </div>
  </div>
</div>
      </section>
  
      {/* Content Section */}
      <div className="w-screen min-h-screen bg-white">
        <div id="content" className="relative w-full bg-white z-10 mt-[100vh]">
          <div className="space-y-6  min-h-screen bg-white">
            <h1 className="text-4xl font-bold mb-8 mt-12 px-8 md:px-12 lg:px-24 xl:px-48">Anime Explorer</h1>
            
            {/* Filters Section */}
            <div className="mb-12 px-4">
              <div className="flex flex-wrap gap-4 px-4 md:px-12 lg:px-24 xl:px-48 ">
                {/* Search Bar */}
                <div className="flex-1 max-w-md ml-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                      placeholder="Search anime..."
                      className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSearching}
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Genre Filter */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-4 py-2 ml-4 border rounded-lg flex items-center gap-2 hover:bg-gray-50 min-w-[200px]"
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
                                onChange={() => toggleGenre(genre)}
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
                    className="px-4 py-2 ml-4 border rounded-lg flex items-center gap-2 hover:bg-gray-50 min-w-[200px]"
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
                                onChange={() => handleCreatorSelect(creator)}
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
                    className="px-4 py-2 ml-4 border rounded-lg flex items-center gap-2 hover:bg-gray-50 min-w-[200px]"
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
                                onChange={() => handleStudioSelect(studio)}
                                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <div className="font-medium">{studio.name}</div>
                                {studio.type && (
                                  <div className="text-sm text-gray-500">{studio.type}</div>
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
            </div>
            {/* Anime List Section */}
            <div className="mt-12 pb-24 px-4 md:px-12 lg:px-24 xl:px-48">
              {renderAnimeSection('', animeList, genreLoading, 'anime-list')}
              
              {/* Pagination */}
              {animeList.length > 0 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    isLoading={genreLoading}
                  />
                </div>
              )}
            </div>
          </div>
     
        </div>
      </div>
      {selectedAnime && (
        <AnimePreview
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          anime={selectedAnime}
        />
      )}
    </main>
  );
}

export default GenrePage;
