import React, { useEffect, useState, useCallback } from 'react';
import { fetchFromAPI } from '../api';
import { MessageCircle, Users, ExternalLink, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
}

// Function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    }
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Generate alphabet array
const alphabet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

const ForumPage: React.FC = () => {
  const [topAnime, setTopAnime] = useState<AnimeBasic[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AnimeBasic | null>(null);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [letterAnimeList, setLetterAnimeList] = useState<AnimeBasic[]>([]);
  const [isLetterLoading, setIsLetterLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchResults, setSearchResults] = useState<AnimeBasic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [forumSearchTerm, setForumSearchTerm] = useState('');
  const [showLetterNav, setShowLetterNav] = useState(false);

  // Fetch top anime for quick access
  useEffect(() => {
    const fetchTopAnime = async () => {
      try {
        const response = await fetchFromAPI<{ data: AnimeBasic[] }>('/top/anime', {
          limit: '20',
          filter: 'bypopularity'
        });
        if (response?.data) {
          setTopAnime(response.data);
        }
      } catch (err) {
        console.error('Error fetching top anime:', err);
      }
    };

    fetchTopAnime();
  }, []);

  // Debounced anime search
  useEffect(() => {
    const searchAnime = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetchFromAPI<{ data: AnimeBasic[] }>('/anime', {
          q: searchTerm,
          limit: '24',
          order_by: 'popularity',
          sort: 'asc'
        });
        
        if (response?.data) {
          setSearchResults(response.data);
        }
      } catch (err) {
        console.error('Error searching anime:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      searchAnime();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch anime by letter
  const fetchAnimeByLetter = useCallback(async (letter: string, pageNum: number) => {
    if (!letter || isLetterLoading) return;

    setIsLetterLoading(true);
    try {
      const response = await fetchFromAPI<{ data: AnimeBasic[], pagination: { has_next_page: boolean } }>('/anime', {
        letter: letter,
        page: pageNum.toString(),
        limit: '24',
        order_by: 'title',
        sort: 'asc'
      });
      
      if (response?.data) {
        if (pageNum === 1) {
          setLetterAnimeList(response.data);
        } else {
          setLetterAnimeList(prev => [...prev, ...response.data]);
        }
        setHasMore(response.pagination.has_next_page);
      }
    } catch (err) {
      console.error('Error fetching anime by letter:', err);
    } finally {
      setIsLetterLoading(false);
    }
  }, [isLetterLoading]);

  // Handle letter selection
  const handleLetterClick = useCallback((letter: string) => {
    setSelectedLetter(letter);
    setPage(1);
    setLetterAnimeList([]);
    setHasMore(true);
    fetchAnimeByLetter(letter, 1);
  }, [fetchAnimeByLetter]);

  // Load more anime for the selected letter
  const loadMore = useCallback(() => {
    if (selectedLetter && hasMore && !isLetterLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAnimeByLetter(selectedLetter, nextPage);
    }
  }, [selectedLetter, hasMore, isLetterLoading, page, fetchAnimeByLetter]);

  // Fetch forum posts when an anime is selected
  useEffect(() => {
    const fetchForumPosts = async () => {
      if (!selectedAnime) {
        setForumPosts([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchFromAPI<{ data: ForumPost[] }>(`/anime/${selectedAnime.mal_id}/forum`);
        if (response?.data) {
          setForumPosts(response.data);
        }
      } catch (err) {
        setError('Failed to load forum posts');
        console.error('Error fetching forum posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForumPosts();
  }, [selectedAnime]);

  // Filter forum posts based on search term
  const filteredPosts = forumPosts.filter(post =>
    post.title.toLowerCase().includes(forumSearchTerm.toLowerCase()) ||
    post.author_username.toLowerCase().includes(forumSearchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Anime Forum Discussions</h1>

      <div className="mb-8 space-y-4">
        {/* Main Search and Quick Access */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Anime Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search for anime by title..."
              className="w-full p-3 border rounded-lg pl-10 text-lg"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedLetter(null);
              }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            
            {/* Search Results Dropdown */}
            {searchTerm && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="flex justify-center items-center p-4">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((anime) => (
                    <div
                      key={anime.mal_id}
                      onClick={() => {
                        setSelectedAnime(anime);
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <img
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-2">{anime.title}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No anime found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Access Dropdown */}
          <div className="relative flex-shrink-0 w-full sm:w-64">
            <select
              className="w-full p-3 border rounded-lg appearance-none bg-white pr-8 text-lg"
              onChange={(e) => {
                const anime = topAnime.find(a => a.mal_id === parseInt(e.target.value));
                setSelectedAnime(anime || null);
              }}
              value={selectedAnime?.mal_id || ''}
            >
              <option value="">Quick access (Top 20)</option>
              {topAnime.map((anime) => (
                <option key={anime.mal_id} value={anime.mal_id}>
                  {anime.title}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Browse by Letter Toggle */}
        <button
          onClick={() => setShowLetterNav(!showLetterNav)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          {showLetterNav ? 'Hide' : 'Show'} Alphabetical Browse
          <svg
            className={`w-4 h-4 transform transition-transform ${showLetterNav ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Alphabet Index (Collapsible) */}
        {showLetterNav && (
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-wrap gap-2">
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleLetterClick(letter)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    selectedLetter === letter
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedAnime && (
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
            <img
              src={selectedAnime.images.jpg.image_url}
              alt={selectedAnime.title}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h2 className="text-xl font-semibold">{selectedAnime.title}</h2>
              <Link
                to={`/anime/${selectedAnime.mal_id}`}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View Anime Details
              </Link>
            </div>
          </div>
        )}

        {/* Forum Search (only shown when anime is selected) */}
        {selectedAnime && (
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search forum discussions..."
              className="w-full p-3 border rounded-lg pl-10 text-lg"
              value={forumSearchTerm}
              onChange={(e) => setForumSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Letter-based Anime Grid */}
      {selectedLetter && showLetterNav && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Anime Starting with '{selectedLetter}'</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {letterAnimeList.map((anime) => (
              <div
                key={anime.mal_id}
                onClick={() => setSelectedAnime(anime)}
                className="cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <img
                  src={anime.images.jpg.image_url}
                  alt={anime.title}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                <div className="p-2">
                  <h3 className="text-sm font-medium line-clamp-2">{anime.title}</h3>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isLetterLoading}
              className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2"
            >
              {isLetterLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  Load More
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Forum Posts */}
      {selectedAnime && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Forum Discussions</h2>
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            filteredPosts.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No forum discussions found for this anime.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.mal_id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200"
                >
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-2 hover:text-blue-600">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <a
                              href={post.author_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.author_username}
                            </a>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments}
                          </div>
                          <div>{formatDate(post.date)}</div>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </a>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ForumPage;
