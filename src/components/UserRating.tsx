import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { fetchFromAPI, RequestPriority } from '../utils/api';

interface AnimeRating {
  anime_id: number;
  rating: number;
  title: string;
  image_url: string;
}

export function UserRating() {
  const [ratings, setRatings] = useState<AnimeRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserRatings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserRatings = async () => {
    try {
      setError(null);
      setLoadingProgress(0);
      
      // Fetch user feedback from Supabase
      const { data: userFeedback, error: feedbackError } = await supabase
        .from('user_feedback')
        .select('anime_id, rating')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      if (!userFeedback || userFeedback.length === 0) {
        setRatings([]);
        return;
      }

      // Process anime in batches to avoid rate limiting
      const BATCH_SIZE = 3;
      const animeDetails: AnimeRating[] = [];
      
      for (let i = 0; i < userFeedback.length; i += BATCH_SIZE) {
        const batch = userFeedback.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (feedback) => {
          try {
            const data = await fetchFromAPI<any>(
              `/anime/${feedback.anime_id}`,
              {},
              RequestPriority.LOW
            );
            
            return {
              anime_id: feedback.anime_id,
              rating: feedback.rating,
              title: data.data.title,
              image_url: data.data.images.jpg.image_url,
            };
          } catch (error) {
            console.error(`Error fetching anime ${feedback.anime_id}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter((result): result is AnimeRating => result !== null);
        animeDetails.push(...validResults);

        // Update progress
        setLoadingProgress(Math.round((i + batch.length) / userFeedback.length * 100));
      }

      setRatings(animeDetails);
    } catch (error: any) {
      console.error('Error fetching ratings:', error);
      setError(error.message || 'Failed to fetch ratings');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }

    // Half star
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }

    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
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
          onClick={fetchUserRatings}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Anime Ratings</h1>
      {ratings.length === 0 ? (
        <p className="text-gray-600">You haven't rated any anime yet.</p>
      ) : (
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
                />
                <div className="p-4">
                  <h2 className="font-semibold text-lg mb-2 truncate">
                    {anime.title}
                  </h2>
                  <div className="flex items-center space-x-1">
                    {renderStars(anime.rating)}
                    <span className="ml-2 text-gray-600">
                      {anime.rating.toFixed(1)}/10
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
