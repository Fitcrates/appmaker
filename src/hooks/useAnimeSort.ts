import { useCallback } from 'react';
import { Anime } from '../types/anime';

export const useAnimeSort = () => {
  const sortAnimeList = useCallback((
    animeList: Anime[],
    sortOrder: 'asc' | 'desc' | null
  ): Anime[] => {
    if (!sortOrder || !animeList) return animeList;

    return [...animeList].sort((a, b) => {
      const aValue = a.scored_by || 0;
      const bValue = b.scored_by || 0;
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, []);

  return { sortAnimeList };
};
