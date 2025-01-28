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
  id: number;
  anime_id: number;
  rating: number;
  title?: string;
  image_url?: string;
  anime_title?: string;
  anime_image?: string;
  updated_at?: string;
  isEnhanced?: boolean;
}

const ITEMS_PER_PAGE = 12;
const PLACEHOLDER_IMAGE = '/placeholder.jpg';
const BATCH_SIZE = 3;

export function UserRating() {
  const [ratings, setRatings] = useState<AnimeRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedAnimeCount, setLoadedAnimeCount] = useState(0);
  const { user } = useAuth();

  // Fetch anime details and update database
  const enhanceAnimeData = async (rating: AnimeRating) => {
    try {
      // Check if we already have the enhanced data
      if (rating.anime_title && rating.anime_image) {
        return {
          ...rating,
          title: rating.anime_title,
          image_url: rating.anime_image,
          isEnhanced: true
        };
      }

      // Fetch from API
      const animeData = await fetchFromAPI<any>(
        `/anime/${rating.anime_id}`,
        {},
        RequestPriority.LOW
      );

      if (!animeData?.data) {
        throw new Error('No data received from API');
      }

      // Update the database with the new information
      const { error: updateError } = await supabase
        .from('user_feedback')
        .update({
          anime_title: animeData.data.title,
          anime_image: animeData.data.images.jpg.image_url
        })
        .eq('id', rating.id);

      if (updateError) {
        console.error('Error updating anime data:', updateError);
      }

      // Return enhanced rating
      return {
        ...rating,
        title: animeData.data.title,
        image_url: animeData.data.images.jpg.image_url,
        anime_title: animeData.data.title,
        anime_image: animeData.data.images.jpg.image_url,
        isEnhanced: true
      };
    } catch (error) {
      console.error(`Error enhancing anime ${rating.anime_id}:`, error);
      return rating;
    }
  };

  // Load ratings with progressive enhancement
  const fetchUserRatings = useCallback(async (page: number) => {
    if (!user) return;

    try {
      setError(null);
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      
      // Fetch total count
      const { count } = await supabase
        .from('user_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setTotalItems(count || 0);

      // Fetch paginated feedback
      const { data: userFeedback, error: feedbackError } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (feedbackError) throw feedbackError;

      // Initialize ratings with basic data
      setRatings(userFeedback.map(feedback => ({
        ...feedback,
        title: feedback.anime_title || undefined,
        image_url: feedback.anime_image || PLACEHOLDER_IMAGE,
        isEnhanced: !!(feedback.anime_title && feedback.anime_image)
      })));

      setLoading(false);

      // Progressively enhance data in batches
      const enhanceBatch = async (startIdx: number) => {
        if (startIdx >= userFeedback.length) {
          setIsLoadingMore(false);
          return;
        }

        setIsLoadingMore(true);
        const endIdx = Math.min(startIdx + BATCH_SIZE, userFeedback.length);
        const currentBatch = userFeedback.slice(startIdx, endIdx);

        const enhancedBatch = await Promise.all(
          currentBatch.map(rating => enhanceAnimeData(rating))
        );

        setRatings(prevRatings => {
          const newRatings = [...prevRatings];
          enhancedBatch.forEach((enhancedRating, idx) => {
            newRatings[startIdx + idx] = enhancedRating;
          });
          return newRatings;
        });

        setLoadedAnimeCount(endIdx);

        // Process next batch
        if (endIdx < userFeedback.length) {
          setTimeout(() => enhanceBatch(endIdx), 100);
        } else {
          setIsLoadingMore(false);
        }
      };

      // Start enhancing the first batch
      enhanceBatch(0);

    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError('Failed to load ratings');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserRatings(currentPage);
  }, [currentPage, fetchUserRatings]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setLoadedAnimeCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {ratings.map((rating, index) => (
          <div
            key={rating.anime_id}
            className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
              rating.isEnhanced ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <Link to={`/anime/${rating.anime_id}`}>
              <img
                src={rating.image_url || PLACEHOLDER_IMAGE}
                alt={rating.title || `Anime ${rating.anime_id}`}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 line-clamp-2">
                  {rating.title || `Loading...`}
                </h3>
                <div className="flex items-center mt-2 flex-wrap">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-3 h-3 ${
                        i < rating.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {rating.updated_at && (
                  <div className="text-sm text-gray-500 mt-2">
                    {new Date(rating.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>

      {totalItems > ITEMS_PER_PAGE && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 mr-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * ITEMS_PER_PAGE >= totalItems}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
