import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
}

export function useWatchlist() {
  const { user } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchWatchlistStatus = async () => {
    try {
      // If no user is logged in, return early
      if (!user) {
        setIsInWatchlist({});
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('anime_watchlist')
        .select('anime_id')
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching watchlist status:', error);
        return;
      }

      const watchlistMap = (data || []).reduce((acc: { [key: number]: boolean }, item) => {
        acc[item.anime_id] = true;
        return acc;
      }, {});

      setIsInWatchlist(watchlistMap);
    } catch (error) {
      console.error('Error fetching watchlist status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async (anime: Anime) => {
    try {
      if (!user) {
        throw new Error('Must be logged in to manage watchlist');
      }

      const { error } = await supabase
        .from('anime_watchlist')
        .insert({
          user_id: user.id,
          anime_id: anime.mal_id,
          anime_title: anime.title,
          anime_image: anime.images.jpg.image_url,
          status: 'planning'
        });

      if (error) {
        console.error('Error adding to watchlist:', error);
        throw error;
      }

      setIsInWatchlist(prev => ({ ...prev, [anime.mal_id]: true }));
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      throw err;
    }
  };

  const removeFromWatchlist = async (animeId: number) => {
    try {
      if (!user) {
        throw new Error('Must be logged in to manage watchlist');
      }

      const { error } = await supabase
        .from('anime_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', animeId);

      if (error) {
        console.error('Error removing from watchlist:', error);
        throw error;
      }

      setIsInWatchlist(prev => {
        const newState = { ...prev };
        delete newState[animeId];
        return newState;
      });
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchWatchlistStatus();
  }, [user]);

  return {
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isLoading
  };
}
