import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { queries } from '../utils/supabaseClient';

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
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchWatchlistStatus = useCallback(async () => {
    if (!user) {
      setIsInWatchlist({});
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

      setIsInWatchlist(watchlistMap);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a new timeout to fetch after a delay
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
      const { error } = await queries.addToWatchlist?.(user.id, anime.mal_id);
      if (error) throw error;

      setIsInWatchlist(prev => ({
        ...prev,
        [anime.mal_id]: true
      }));
    } catch (error: any) {
      if (!error.message?.includes('Failed to fetch')) {
        console.error('Error adding to watchlist:', error);
      }
    }
  }, [user]);

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
    } catch (error: any) {
      if (!error.message?.includes('Failed to fetch')) {
        console.error('Error removing from watchlist:', error);
      }
    }
  }, [user]);

  return {
    isInWatchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist
  };
}
