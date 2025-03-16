import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Genre } from '../hooks/useGenreFilter';
import { Creator } from '../hooks/useCreatorFilter';
import { Studio } from '../hooks/useStudioFilter';

interface AnimeFilterState {
  // Search and pagination
  searchQuery: string;
  currentPage: number;
  topAnimePage: number;
  
  // Filters
  selectedGenres: Genre[];
  selectedCreators: Creator[];
  selectedStudios: Studio[];
  scoredBySort: 'asc' | 'desc' | null;
  showTvSeries: boolean;
  showMovies: boolean;
  hideHentai: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  setTopAnimePage: (page: number) => void;
  setSelectedGenres: (genres: Genre[]) => void;
  setSelectedCreators: (creators: Creator[]) => void;
  setSelectedStudios: (studios: Studio[]) => void;
  setScoredBySort: (sort: 'asc' | 'desc' | null) => void;
  setShowTvSeries: (show: boolean) => void;
  setShowMovies: (show: boolean) => void;
  setHideHentai: (hide: boolean) => void;
  resetFilters: () => void;
}

const initialState = {
  searchQuery: '',
  currentPage: 1,
  topAnimePage: 1,
  selectedGenres: [],
  selectedCreators: [],
  selectedStudios: [],
  scoredBySort: null,
  showTvSeries: true,
  showMovies: true,
  hideHentai: true,
};

export const useAnimeStore = create<AnimeFilterState>()(
  persist(
    (set) => ({
      ...initialState,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setTopAnimePage: (page) => set({ topAnimePage: page }),
      setSelectedGenres: (genres) => set({ selectedGenres: genres }),
      setSelectedCreators: (creators) => set({ selectedCreators: creators }),
      setSelectedStudios: (studios) => set({ selectedStudios: studios }),
      setScoredBySort: (sort) => set({ scoredBySort: sort }),
      setShowTvSeries: (show) => set({ showTvSeries: show }),
      setShowMovies: (show) => set({ showMovies: show }),
      setHideHentai: (hide) => set({ hideHentai: hide }),
      resetFilters: () => set(initialState),
    }),
    {
      name: 'anime-filters',
      partialize: (state) => ({
        ...state,
      }),
    }
  )
);