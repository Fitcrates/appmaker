import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { queries } from '../lib/supabase';

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
  const [watchlistItems, setWatchlistItems] = useState<Array<{
    anime_id: number;
    anime_title: string;
    anime_image: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchWatchlistStatus = useCallback(async () => {
    if (!user) {
      setIsInWatchlist({});
      setWatchlistItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await queries.getWatchlistStatus(user.id);

      if (error) {
        if (!error.message?.includes('Failed to fetch')) {
          console.error('Error fetching watchlist status:', error);
        }
        return;
      }

      const watchlistMap = (data || []).reduce((acc: { [key: number]: boolean }, item) => {
        acc[item.anime_id] = true;
        return acc;
      }, {});

      console.log('Watchlist map:', watchlistMap); // Debug log
      setIsInWatchlist(watchlistMap);
      setWatchlistItems(data || []);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(fetchWatchlistStatus, 500);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchWatchlistStatus]);

  const addToWatchlist = useCallback(async (anime: Anime) => {
    if (!user) return;

    try {
      const { error } = await queries.addToWatchlist?.(user.id, anime);
      if (error) throw error;

      setIsInWatchlist(prev => ({
        ...prev,
        [anime.mal_id]: true
      }));
      
      setWatchlistItems(prev => [...prev, {
        anime_id: anime.mal_id,
        anime_title: anime.title,
        anime_image: anime.images.jpg.image_url
      }]);

      // Force refresh watchlist status
      fetchWatchlistStatus();
    } catch (error: any) {
      if (!error.message?.includes('Failed to fetch')) {
        console.error('Error adding to watchlist:', error);
      }
    }
  }, [user, fetchWatchlistStatus]);

  const removeFromWatchlist = useCallback(async (animeId: number) => {
    if (!user) return;

    try {
      const { error } = await queries.removeFromWatchlist?.(user.id, animeId);
      if (error) throw error;

      setIsInWatchlist(prev => {
        const newState = { ...prev };
        delete newState[animeId];
        return newState;
      });
      
      setWatchlistItems(prev => prev.filter(item => item.anime_id !== animeId));
    } catch (error: any) {
      if (!error.message?.includes('Failed to fetch')) {
        console.error('Error removing from watchlist:', error);
      }
    }
  }, [user]);

  return {
    isInWatchlist,
    watchlistItems,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
  };
}
