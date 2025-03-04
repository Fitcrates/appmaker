import { useState, useCallback } from 'react';
import { fetchFromAPI } from '../utils/api';

export const useAnimeDetails = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnimeDetails = useCallback(async (animeId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchFromAPI(`/anime/${animeId}/full`);
      return response?.data;
    } catch (err) {
      console.error('Error fetching anime details:', err);
      setError('Failed to load anime details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchAnimeDetails,
    isLoading,
    error
  };
};
