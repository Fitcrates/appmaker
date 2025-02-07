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
        console.error('Error fetching watchlist:', error);
        return;
      }

      if (data) {
        const watchlistMap = data.reduce((acc: { [key: number]: boolean }, item: any) => {
          acc[item.anime_id] = true;
          return acc;
        }, {});
        setIsInWatchlist(watchlistMap);
        setWatchlistItems(data);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addToWatchlist = useCallback(async (anime: Anime) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await queries.addToWatchlist(user.id, anime);
      
      if (error) {
        console.error('Error adding to watchlist:', error);
        return;
      }

      // Update local state
      setIsInWatchlist(prev => ({ ...prev, [anime.mal_id]: true }));
      setWatchlistItems(prev => [...prev, {
        anime_id: anime.mal_id,
        anime_title: anime.title,
        anime_image: anime.images?.jpg?.image_url || anime.image_url
      }]);

      // Refetch to ensure consistency
      fetchWatchlistStatus();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchWatchlistStatus]);

  const removeFromWatchlist = useCallback(async (animeId: number) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await queries.removeFromWatchlist(user.id, animeId);

      if (error) {
        console.error('Error removing from watchlist:', error);
        return;
      }

      // Update local state
      setIsInWatchlist(prev => {
        const newState = { ...prev };
        delete newState[animeId];
        return newState;
      });
      setWatchlistItems(prev => prev.filter(item => item.anime_id !== animeId));

      // Refetch to ensure consistency
      fetchWatchlistStatus();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchWatchlistStatus]);

  // Fetch watchlist status on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchWatchlistStatus();
    } else {
      setIsInWatchlist({});
      setWatchlistItems([]);
    }
  }, [user, fetchWatchlistStatus]);

  return {
    isInWatchlist,
    watchlistItems,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    refetchWatchlist: fetchWatchlistStatus
  };
}
