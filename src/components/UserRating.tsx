import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { fetchFromAPI, RequestPriority } from '../utils/api';

// Cache for anime details
const animeCache: { [key: number]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface AnimeRating {
  anime_id: number;
  rating: number;
  title: string;
  image_url: string;
  updated_at?: string;
}

interface UserFeedback {
  anime_id: number;
  rating: number;
  updated_at: string;
}

const ITEMS_PER_PAGE = 12;
const PLACEHOLDER_IMAGE = '/placeholder.jpg';
const MIN_BATCH_SIZE = 3;
const MAX_BATCH_SIZE = 10;
const RATE_LIMIT_THRESHOLD = 1000; // 1 second in ms

export function UserRating() {
  const [ratings, setRatings] = useState<AnimeRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [batchSize, setBatchSize] = useState(MIN_BATCH_SIZE);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const { user } = useAuth();

  // Fetch anime details with caching
  const fetchAnimeDetails = useCallback(async (animeId: number) => {
    const now = Date.now();
    const cached = animeCache[animeId];
    
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    const data = await fetchFromAPI<any>(
      `/anime/${animeId}`,
      {},
      RequestPriority.LOW
    );
    
    animeCache[animeId] = {
      data: data.data,
      timestamp: now
    };
    
    return data.data;
  }, []);

  // Optimized batch size adjustment
  const adjustBatchSize = useCallback((requestTime: number) => {
    const responseTime = Date.now() - requestTime;
    if (responseTime < RATE_LIMIT_THRESHOLD && batchSize < MAX_BATCH_SIZE) {
      setBatchSize(prev => Math.min(prev + 1, MAX_BATCH_SIZE));
    } else if (responseTime >= RATE_LIMIT_THRESHOLD && batchSize > MIN_BATCH_SIZE) {
      setBatchSize(prev => Math.max(prev - 1, MIN_BATCH_SIZE));
    }
  }, [batchSize]);

  // Fetch ratings with pagination
  const fetchUserRatings = useCallback(async (page: number) => {
    if (!user) return;

    try {
      setError(null);
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      
      // Fetch total count first
      const { count } = await supabase
        .from('user_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setTotalItems(count || 0);

      // Fetch paginated feedback
      const { data: userFeedback, error: feedbackError } = await supabase
        .from('user_feedback')
        .select('anime_id, rating, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (feedbackError) throw feedbackError;

      if (!userFeedback || userFeedback.length === 0) {
        setRatings([]);
        return;
      }

      // Process anime in dynamic batches
      const animeDetails: AnimeRating[] = [];
      
      for (let i = 0; i < userFeedback.length; i += batchSize) {
        const requestStartTime = Date.now();
        const batch = userFeedback.slice(i, i + batchSize);
        const batchPromises = batch.map(async (feedback) => {
          try {
            const animeData = await fetchAnimeDetails(feedback.anime_id);
            
            return {
              anime_id: feedback.anime_id,
              rating: feedback.rating,
              title: animeData.title,
              image_url: animeData.images?.jpg?.image_url || PLACEHOLDER_IMAGE,
              updated_at: feedback.updated_at
            };
          } catch (error) {
            console.error(`Error fetching anime ${feedback.anime_id}:`, error);
            return {
              anime_id: feedback.anime_id,
              rating: feedback.rating,
              title: `Anime ${feedback.anime_id}`,
              image_url: PLACEHOLDER_IMAGE,
              updated_at: feedback.updated_at
            };
          }
        });

        const results = await Promise.all(batchPromises);
        animeDetails.push(...results);
        
        // Update progress
        setLoadingProgress(Math.round((animeDetails.length / userFeedback.length) * 100));
        
        // Adjust batch size based on response time
        adjustBatchSize(requestStartTime);
        
        // Add a small delay between batches to prevent rate limiting
        if (i + batchSize < userFeedback.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setRatings(animeDetails);
    } catch (error: any) {
      console.error('Error fetching ratings:', error);
      setError(error.message || 'Failed to load ratings');
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  }, [user, batchSize, adjustBatchSize, fetchAnimeDetails]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchUserRatings(currentPage);
    } else {
      setLoading(false);
    }
  }, [user, currentPage, fetchUserRatings]);

  // Optimistic update function
  const updateRating = async (animeId: number, newRating: number) => {
    if (!user) return;

    // Optimistically update the UI
    setRatings(prev => 
      prev.map(rating => 
        rating.anime_id === animeId 
          ? { ...rating, rating: newRating, updated_at: new Date().toISOString() }
          : rating
      )
    );

    try {
      const { error } = await supabase
        .from('user_feedback')
        .upsert({
          user_id: user.id,
          anime_id: animeId,
          rating: newRating,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating rating:', error);
      // Revert the optimistic update on error
      fetchUserRatings(currentPage);
    }
  };

  const renderStars = (rating: number, animeId: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;

    // Full stars with click handlers
    for (let i = 0; i < 5; i++) {
      const starRating = (i + 1) * 2;
      stars.push(
        <button
          key={`star-${i}`}
          onClick={() => updateRating(animeId, starRating)}
          className="focus:outline-none"
        >
          <FaStar 
            className={i < fullStars ? "text-yellow-400" : "text-gray-300"} 
          />
        </button>
      );
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-2 text-gray-600">{rating.toFixed(1)}/10</span>
      </div>
    );
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <div className="text-gray-600">Loading your ratings... {loadingProgress}%</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Please log in to view your ratings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={() => fetchUserRatings(currentPage)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Anime Ratings</h1>
      {ratings.length === 0 ? (
        <p className="text-gray-600">You haven't rated any anime yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ratings.map((anime) => (
              <div
                key={anime.anime_id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <Link to={`/anime/${anime.anime_id}`}>
                  <img
                    src={anime.image_url}
                    alt={anime.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                  <div className="p-4">
                    <h2 className="font-semibold text-lg mb-2 truncate">
                      {anime.title}
                    </h2>
                    {renderStars(anime.rating, anime.anime_id)}
                    {anime.updated_at && (
                      <div className="text-sm text-gray-500 mt-2">
                        Updated: {new Date(anime.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
