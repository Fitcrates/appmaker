import { useState, useCallback } from 'react';
import { useAnimeStore } from '../store/animeStore';

export interface Genre {
  id: number;
  name: string;
  count?: number;
}

export const useGenreFilter = () => {
  const { selectedGenres, setSelectedGenres } = useAnimeStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Predefined list of genres with counts
  const genres: Genre[] = [
    { id: 1, name: 'Action', count: 4268 },
    { id: 2, name: 'Adventure', count: 3933 },
    { id: 3, name: 'Cars', count: 254 },
    { id: 4, name: 'Comedy', count: 7890 },
    { id: 5, name: 'Dementia', count: 456 },
    { id: 6, name: 'Demons', count: 789 },
    { id: 7, name: 'Mystery', count: 2345 },
    { id: 8, name: 'Drama', count: 4567 },
    { id: 9, name: 'Ecchi', count: 1890 },
    { id: 10, name: 'Fantasy', count: 5678 },
    { id: 11, name: 'Game', count: 789 },
    { id: 12, name: 'Hentai', count: 0 },
    { id: 13, name: 'Historical', count: 1567 },
    { id: 14, name: 'Horror', count: 1234 },
    { id: 15, name: 'Kids', count: 2345 },
    { id: 16, name: 'Magic', count: 3456 },
    { id: 17, name: 'Martial Arts', count: 1789 },
    { id: 18, name: 'Mecha', count: 2345 },
    { id: 19, name: 'Music', count: 3456 },
    { id: 20, name: 'Parody', count: 890 },
    { id: 21, name: 'Samurai', count: 567 },
    { id: 22, name: 'Romance', count: 5678 },
    { id: 23, name: 'School', count: 4567 },
    { id: 24, name: 'Sci Fi', count: 3456 },
    { id: 25, name: 'Shoujo', count: 2345 },
    { id: 26, name: 'Shoujo Ai', count: 567 },
    { id: 27, name: 'Shounen', count: 4567 },
    { id: 28, name: 'Shounen Ai', count: 678 },
    { id: 29, name: 'Space', count: 1234 },
    { id: 30, name: 'Sports', count: 2345 },
    { id: 31, name: 'Super Power', count: 1890 },
    { id: 32, name: 'Vampire', count: 567 },
    { id: 33, name: 'Yaoi', count: 0 },
    { id: 34, name: 'Yuri', count: 0 },
    { id: 35, name: 'Harem', count: 1890 },
    { id: 36, name: 'Slice of Life', count: 3456 },
    { id: 37, name: 'Supernatural', count: 3456 },
    { id: 38, name: 'Military', count: 1234 },
    { id: 39, name: 'Police', count: 567 },
    { id: 40, name: 'Psychological', count: 1890 },
    { id: 41, name: 'Thriller', count: 2345 },
    { id: 42, name: 'Seinen', count: 1890 },
    { id: 43, name: 'Josei', count: 567 }
  ];

  const filteredGenres = useCallback(() => {
    if (!searchTerm) return genres;
    const searchTermLower = searchTerm.toLowerCase();
    return genres.filter(genre =>
      genre.name.toLowerCase().includes(searchTermLower)
    );
  }, [searchTerm]);

  const handleGenreSelect = useCallback((genre: Genre) => {
    const newSelectedGenres = [...selectedGenres];
    const existingIndex = newSelectedGenres.findIndex(g => g.id === genre.id);
    
    if (existingIndex !== -1) {
      newSelectedGenres.splice(existingIndex, 1);
    } else {
      newSelectedGenres.push(genre);
    }
    
    setSelectedGenres(newSelectedGenres);
  }, [selectedGenres, setSelectedGenres]);

  const clearGenres = useCallback(() => {
    setSelectedGenres([]);
  }, [setSelectedGenres]);

  return {
    genres: filteredGenres(),
    selectedGenres,
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setIsDropdownOpen,
    isGenresLoading: false,
    handleGenreSelect,
    clearGenres
  };
};
