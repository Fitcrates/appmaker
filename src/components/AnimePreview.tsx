import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';
import { supabase, queries } from '../lib/supabase';

interface AnimePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  anime: any;
}

export const AnimePreview: React.FC<AnimePreviewProps> = ({ isOpen, onClose, anime }) => {
  const [userRating, setUserRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const loadRating = async () => {
      if (!user || !anime?.mal_id || !isOpen) return;

      try {
        setIsLoading(true);
        console.log('Loading rating for anime:', anime.mal_id);
        const { data: rating } = await queries.getUserRating(user.id, anime.mal_id);
        if (isMounted) {
          console.log('Received rating:', rating);
          setUserRating(rating || 0);
        }
      } catch (error) {
        console.error('Error loading rating:', error);
        if (isMounted) {
          setUserRating(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRating();

    return () => {
      isMounted = false;
    };
  }, [user, anime?.mal_id, isOpen]);

  const handleRatingChange = async (rating: number) => {
    if (!user) {
      setRatingMessage('Please log in to rate anime');
      return;
    }

    if (!anime?.mal_id) {
      console.error('No anime ID available');
      setRatingMessage('Error: Could not save rating');
      return;
    }

    try {
      setIsLoading(true);
      setRatingMessage('');
      console.log('Saving rating:', { rating, userId: user.id, animeId: anime.mal_id });
      
      const { error } = await supabase
        .from('user_feedback')
        .upsert({
          user_id: user.id,
          anime_id: anime.mal_id,
          rating: rating,
          anime_title: anime.title,
          anime_image: anime.images?.jpg?.image_url,
          genres: anime.genres,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,anime_id'
        });

      if (error) {
        throw error;
      }

      setUserRating(rating);
      setRatingMessage('Rating saved successfully!');
      
      // Clear message after a delay
      setTimeout(() => {
        setRatingMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error saving rating:', error);
      setRatingMessage('Error: Could not save rating');
    } finally {
      setIsLoading(false);
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
      <div className="fixed inset-0 bg-black/60 " />
      
      {/* Preview Content */}
      <div className="fixed inset-0 sm:inset-4 md:inset-8 flex items-center justify-center p-4">
        <div 
          className="backgroundMain w-full max-w-2xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] mt-12 flex flex-col ring-1 ring-white/20"
          onClick={handleContentClick}
          onTouchStart={handleContentClick}
          onTouchMove={handleContentClick}
          onTouchEnd={handleContentClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <h2 className="text-lg sm:text-xl text-white font-semibold line-clamp-1">{anime.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500 text-white hover:text-black rounded-full transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-auto flex-1">
            <div className="sm:flex p-4 gap-4">
              {/* Image and Rating */}
              <div className="w-full sm:w-48 flex-shrink-0 mb-4 sm:mb-0 space-y-4">
                <img
                  src={anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}
                  alt={anime.title}
                  className="w-full aspect-[3/4] object-cover rounded-lg"
                />
                <div className="flex flex-col items-center space-y-2">
                  <StarRating
                    initialRating={userRating}
                    onRatingChange={handleRatingChange}
                    disabled={isLoading}
                  />
                  {ratingMessage && (
                    <p className={`text-sm text-center ${
                      ratingMessage.includes('Failed') || ratingMessage.includes('Error') || ratingMessage.includes('Please log in')
                        ? 'text-red-500' 
                        : 'text-green-500'
                    }`}>
                      {ratingMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-md  font-light text-white/80">Alternative Titles</h3>
                    <p className="mt-1 text-white">{anime.title_english || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-md font-light text-white/80">Score</h3>
                    <p className="mt-1 text-white">{anime.score || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-md font-light text-white/80">Status</h3>
                    <p className="mt-1 text-white">{anime.status || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-smd font-light text-white/80">Episodes</h3>
                    <p className="mt-1 text-white">{anime.episodes || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-md font-light text-white/80">Synopsis</h3>
                    <p className="mt-1 text-sm line-clamp-4 text-white">{anime.synopsis || 'No synopsis available.'}</p>
                  </div>
                </div>

                <div className="mt-6 sticky bottom-0 modalOpenpy-3">
                  <Link
                    to={`/anime/${anime.mal_id}`}
                    onClick={onClose}
                    className="inline-flex items-center cyberpunk-neon-btn blue"
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
