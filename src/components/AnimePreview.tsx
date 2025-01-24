import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface AnimePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  anime: any;
}

export const AnimePreview: React.FC<AnimePreviewProps> = ({ isOpen, onClose, anime }) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user && anime?.mal_id && isOpen) {
      fetchUserRating();
    } else {
      setUserRating(0);
      setRatingMessage('');
    }
  }, [user, anime?.mal_id, isOpen]);

  const fetchUserRating = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_feedback')
        .select('rating')
        .eq('user_id', user?.id)
        .eq('anime_id', anime.mal_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      if (data) {
        setUserRating(data.rating);
      } else {
        setUserRating(0);
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
      setRatingMessage('Failed to load rating');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (!user) {
      setRatingMessage('Please log in to rate anime');
      return;
    }

    if (!anime?.mal_id) {
      setRatingMessage('Invalid anime data');
      return;
    }

    try {
      setIsRating(true);
      setRatingMessage('');

      const { error } = await supabase
        .from('user_feedback')
        .upsert({
          user_id: user.id,
          anime_id: anime.mal_id,
          rating: rating,
        }, {
          onConflict: 'user_id,anime_id'
        });

      if (error) throw error;

      setUserRating(rating);
      setRatingMessage('Rating saved!');
      setTimeout(() => setRatingMessage(''), 2000);
    } catch (error: any) {
      console.error('Error saving rating:', error);
      setRatingMessage(error.message || 'Failed to save rating. Please try again.');
    } finally {
      setIsRating(false);
    }
  };

  if (!isOpen || !anime) return null;

  const handleContentClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] touch-none"
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black opacity-60 backdrop-blur" />
      
      {/* Preview Content */}
      <div className="fixed inset-0 sm:inset-4 md:inset-8 flex items-center justify-center p-4">
        <div 
          className="bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={handleContentClick}
          onTouchStart={handleContentClick}
          onTouchMove={handleContentClick}
          onTouchEnd={handleContentClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <h2 className="text-lg sm:text-xl font-semibold line-clamp-1">{anime.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-auto flex-1">
            <div className="sm:flex p-4 gap-4">
              {/* Image */}
              <div className="w-full sm:w-48 flex-shrink-0 mb-4 sm:mb-0">
                <img
                  src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}
                  alt={anime.title}
                  className="w-full aspect-[3/4] object-cover rounded-lg"
                />
                {/* Rating Component */}
                <div className="mt-4">
                  {isLoading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <>
                      <StarRating 
                        initialRating={userRating} 
                        onRatingChange={handleRatingChange}
                        disabled={isRating} 
                      />
                      {!user && (
                        <p className="text-sm text-center mt-2 text-gray-500">
                          Log in to rate anime
                        </p>
                      )}
                      {ratingMessage && (
                        <p className={`text-sm text-center mt-2 ${
                          ratingMessage.includes('Failed') || ratingMessage.includes('Error') || ratingMessage.includes('Please log in')
                            ? 'text-red-500' 
                            : 'text-green-500'
                        }`}>
                          {ratingMessage}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Alternative Titles</h3>
                    <p className="mt-1">{anime.title_english || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Score</h3>
                    <p className="mt-1">{anime.score || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-1">{anime.status || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Episodes</h3>
                    <p className="mt-1">{anime.episodes || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Synopsis</h3>
                    <p className="mt-1 text-sm line-clamp-4">{anime.synopsis || 'No synopsis available.'}</p>
                  </div>
                </div>

                <div className="mt-6 sticky bottom-0 bg-white py-3">
                  <Link
                    to={`/anime/${anime.mal_id}`}
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
