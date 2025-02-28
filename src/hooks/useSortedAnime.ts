import { useMemo } from 'react';

interface Anime {
  mal_id: number;
  scored_by?: number;
  score?: number;
}

export const useSortedAnime = (
  animeList: Anime[],
  sortOrder: 'asc' | 'desc' | null
) => {
  return useMemo(() => {
    if (!sortOrder || !animeList) return animeList;

    return [...animeList].sort((a, b) => {
      const aValue = a.scored_by || 0;
      const bValue = b.scored_by || 0;
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [animeList, sortOrder]);
};
