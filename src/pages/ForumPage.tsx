import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { LetterBrowse } from '../components/ui/Filters/LetterBrowse';
import { QuickAccessDropdown } from '../components/ui/Filters/QuickAccessDropdown';
import { HentaiFilter } from '../components/ui/Filters/HentaiFilter';
import { Search } from 'lucide-react';
import ForumPosts from '../components/anime/ForumPosts';
import '../index.css';

interface ForumPost {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  author_url: string;
  comments: number;
  images?: {
    jpg?: {
      image_url?: string;
    };
  };
}

interface AnimeBasic {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  rating?: string;
}

export default function ForumPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<AnimeBasic | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [letterAnimeList, setLetterAnimeList] = useState<AnimeBasic[]>([]);
  const [isLetterLoading, setIsLetterLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [hideHentai, setHideHentai] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [forumSearchTerm, setForumSearchTerm] = useState('');
  const [showLetterNav, setShowLetterNav] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topAnime, setTopAnime] = useState<AnimeBasic[]>([]);
  const [searchResults, setSearchResults] = useState<AnimeBasic[]>([]);

  // Refs to track current state values without triggering re-renders
  const isLetterLoadingRef = useRef(false);
  const currentLetterRef = useRef<string | null>(null);
  const currentPageRef = useRef(1);

  // Generate alphabet array
  const alphabet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

  // Fetch top anime for quick access
  useEffect(() => {
    const fetchTopAnime = async () => {
      try {
        const response = await fetchFromAPI<{ data: AnimeBasic[] }>('/top/anime', {
          limit: '20',
          filter: 'bypopularity',
          bypass_cache: true // Force fresh data from API
        });
        if (response?.data) {
          const filteredData = hideHentai 
            ? response.data.filter(anime => anime.rating !== 'Rx - Hentai')
            : response.data;
          console.log('Top anime data received:', filteredData.length, 'items');
          setTopAnime(filteredData);
        }
      } catch (err) {
        console.error('Error fetching top anime:', err);
      }
    };

    fetchTopAnime();
  }, [hideHentai]);

  // Fetch anime by letter - Fixed to prevent infinite rerenders
  const fetchAnimeByLetter = useCallback(async (letter: string, pageNum: number) => {
    // Return early if already loading
    if (isLetterLoadingRef.current) {
      return;
    }
    
    // Update refs
    isLetterLoadingRef.current = true;
    currentLetterRef.current = letter;
    currentPageRef.current = pageNum;
    
    // Update state
    setIsLetterLoading(true);
    setError(null);
    console.log(`Fetching anime by letter: ${letter}, page: ${pageNum}`);
    
    try {
      const response = await fetchFromAPI<{ data: AnimeBasic[], pagination: { has_next_page: boolean, last_visible_page: number } }>('/anime', {
        letter: letter,
        page: pageNum.toString(),
        limit: '12',
        order_by: 'title',
        sort: 'asc',
        bypass_cache: true // Force fresh data from API
      });
      
      if (response?.data) {
        const filteredData = hideHentai 
          ? response.data.filter(anime => anime.rating !== 'Rx - Hentai')
          : response.data;
        console.log(`Letter ${letter} data received:`, filteredData.length, 'items');
        setLetterAnimeList(filteredData);
        
        // Update pagination directly from API response
        setTotalPages(response.pagination.last_visible_page);
        setHasMore(response.pagination.has_next_page);
        console.log(`Letter ${letter} pagination:`, response.pagination);
      }
    } catch (err) {
      console.error('Error fetching anime by letter:', err);
      setError('Failed to load anime list');
    } finally {
      setIsLetterLoading(false);
      isLetterLoadingRef.current = false;
    }
  }, [hideHentai]);

  // Effect to fetch anime when letter or page changes
  useEffect(() => {
    if (selectedLetter) {
      fetchAnimeByLetter(selectedLetter, page);
    }
  }, [selectedLetter, page, fetchAnimeByLetter]);

  // Handle letter selection - Reset page to 1
  const handleLetterClick = useCallback((letter: string) => {
    if (letter === selectedLetter) return; // Prevent re-selecting the same letter
    
    setSelectedLetter(letter);
    setPage(1);
    currentPageRef.current = 1; // Update the ref as well
    setShowResults(true); // Ensure results are shown when a letter is selected
  }, [selectedLetter]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return; // Prevent setting the same page
    setPage(newPage);
    currentPageRef.current = newPage; // Update the ref as well
  }, [page]);

  // Fetch forum posts
  const fetchForumPosts = useCallback(async (animeId: number) => {
    setIsLoadingPosts(true);
    setError(null);
    try {
      console.log('Fetching forum posts for anime ID:', animeId);
      const response = await fetchFromAPI<{ data: ForumPost[] }>(`/anime/${animeId}/forum`, {}, RequestPriority.HIGH);
      console.log('Forum posts response:', response);
      
      if (response?.data) {
        if (response.data.length === 0) {
          console.log('No forum posts found for this anime');
          setForumPosts([]);
        } else {
          console.log(`Found ${response.data.length} forum posts`);
          setForumPosts(response.data);
        }
      } else {
        console.error('Invalid response format:', response);
        setForumPosts([]);
        setError('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching forum posts:', err);
      setForumPosts([]);
      setError(err instanceof Error ? err.message : 'Failed to load forum posts');
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  const handleAnimeCardClick = useCallback((anime: AnimeBasic) => {
    setSelectedAnime(anime);
    setShowLetterNav(false);
    setShowResults(false);
    fetchForumPosts(anime.mal_id);
  }, [fetchForumPosts]);

  // Reset showResults when letter navigation is opened
  useEffect(() => {
    if (showLetterNav) {
      setShowResults(true);
    }
  }, [showLetterNav]);

  // Debounced anime search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const searchAnime = async () => {
      setIsSearching(true);
      try {
        const response = await fetchFromAPI<{ data: AnimeBasic[] }>('/anime', {
          q: searchTerm,
          limit: '24',
          order_by: 'popularity',
          sort: 'asc'
        });
        
        if (response?.data) {
          const filteredResults = hideHentai 
            ? response.data.filter(anime => anime.rating !== 'Rx - Hentai')
            : response.data;
          setSearchResults(filteredResults);
        }
      } catch (err) {
        console.error('Error searching anime:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      searchAnime();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, hideHentai]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    if (newValue.trim()) {
      setSelectedLetter(null);
      currentLetterRef.current = null;
    }
  }, []);

  // Handle search result click
  const handleSearchResultClick = useCallback((anime: AnimeBasic) => {
    setSelectedAnime(anime);
    setSearchTerm('');
    setSearchResults([]);
    setShowLetterNav(false);
    setShowResults(false);
    fetchForumPosts(anime.mal_id);
  }, [fetchForumPosts]);

  // Load more anime for the selected letter
  const loadMore = useCallback(() => {
    if (selectedLetter && hasMore && !isLetterLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      currentPageRef.current = nextPage;
    }
  }, [selectedLetter, hasMore, isLetterLoading, page]);

  return (
    <div id="forum" className="min-h-screen mx-auto py-12 max-w-[100rem] space-y-6 px-4 sm:px-6 lg:px-8 mt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-6 bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon">
          Anime Forum Discussions
        </h1>

        <div className="flex flex-wrap md:flex-row gap-4 mb-4">
          <QuickAccessDropdown
            topAnime={topAnime}
            setSelectedAnime={setSelectedAnime}
            selectedAnime={selectedAnime}
            onAnimeSelect={handleAnimeCardClick}
          />
          <HentaiFilter
            hideHentai={hideHentai}
            setHideHentai={setHideHentai}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center md:items-center">
        {/* Anime Search */}
        <div className="relative justify-center items-center flex-1">
          <input
            type="text"
            placeholder="Search for anime by title..."
            className="w-full p-3 pl-10 pr-10 bg-white/15 placeholder:text-white text-white ring-1 ring-white/40 rounded-lg text-lg "
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white" />
          
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white hover:text-white transition-colors duration-200"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          
          {/* Search Results Dropdown */}
          {searchTerm && (
            <div className="absolute z-50 w-full mt-1 backgroundMain text-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2 divide-y divide-white/10 ">
                  {searchResults.map((anime) => (
                    <button
                      key={anime.mal_id}
                      onClick={() => handleSearchResultClick(anime)}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 transition-colors duration-200"
                    >
                      <div className="relative w-10 h-14 flex-shrink-0">
                        <img
                          src={anime.images.jpg.image_url}
                          alt={anime.title}
                          className="absolute inset-0 w-full h-full object-cover rounded shadow-md"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] transition-all duration-200">
                          {anime.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-white">No anime found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Letter Browse Section */}
      <LetterBrowse
        alphabet={alphabet}
        selectedLetter={selectedLetter}
        onLetterClick={handleLetterClick}
        showLetterNav={showLetterNav}
        setShowLetterNav={setShowLetterNav}
        letterAnimeList={letterAnimeList}
        loadMore={loadMore}
        hasMore={hasMore}
        isLetterLoading={isLetterLoading}
        selectedAnime={selectedAnime}
        onAnimeSelect={setSelectedAnime}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onAnimeCardClick={handleAnimeCardClick}
        showResults={showResults}
      />

      {/* Selected Anime Info with Animation */}
      <div className={`transform transition-all duration-300 ease-in-out ${selectedAnime && !showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'}`}>
        {selectedAnime && (
          <div className="mb-6 p-4 ring-1 ring-white/40 rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src={selectedAnime.images.jpg.image_url}
                alt={selectedAnime.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedAnime.title}</h2>
                <p className="text-gray-400">Forum Topics</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forum Posts Table with Animation */}
      <div className={`transform transition-all duration-300 ease-in-out ${selectedAnime ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {selectedAnime && (
          <div className="space-y-4">
            {isLoadingPosts ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin h-8 w-8 border-4 border-[#4ef1d6] border-t-transparent rounded-full"></div>
              </div>
            ) : forumPosts.length > 0 ? (
              <ForumPosts
                posts={forumPosts}
                isLoading={isLoadingPosts}
                error={error}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">No forum posts found for this anime.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
