import React, { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';
import { GenreFilter } from './GenreFilter';
import { CreatorFilter } from './CreatorFilter';
import { StudioFilter } from './StudioFilter';
import { SortScoredBy } from './SortScoredBy';
import { HentaiFilter } from './HentaiFilter';
import { Genre } from '../../../hooks/useGenreFilter';
import { Creator } from '../../../hooks/useCreatorFilter';
import { Studio } from '../../../hooks/useStudioFilter';

interface GeneralFilterProps {
  selectedGenres: Genre[];
  setSelectedGenres: (genres: Genre[]) => void;
  selectedCreators: Creator[];
  setSelectedCreators: (creators: Creator[]) => void;
  selectedStudios: Studio[];
  setSelectedStudios: (studios: Studio[]) => void;
  scoredBySort: 'asc' | 'desc' | null;
  setScoredBySort: (sort: 'asc' | 'desc' | null) => void;
  showTvSeries: boolean;
  setShowTvSeries: (show: boolean) => void;
  showMovies: boolean;
  setShowMovies: (show: boolean) => void;
  hideHentai: boolean;
  setHideHentai: (hide: boolean) => void;
}

export function GeneralFilter({
  selectedGenres,
  setSelectedGenres,
  selectedCreators,
  setSelectedCreators,
  selectedStudios,
  setSelectedStudios,
  scoredBySort,
  setScoredBySort,
  showTvSeries,
  setShowTvSeries,
  showMovies,
  setShowMovies,
  hideHentai,
  setHideHentai
}: GeneralFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClearAll = () => {
    setSelectedGenres([]);
    setSelectedCreators([]);
    setSelectedStudios([]);
    setScoredBySort(null);
    setShowTvSeries(false);
    setShowMovies(false);
    setHideHentai(false);
  };

  useEffect(() => {
    console.log('Selected genres:', selectedGenres);
    console.log('Selected creators:', selectedCreators);
    console.log('Selected studios:', selectedStudios);
  }, [selectedGenres, selectedCreators, selectedStudios]);

  const handleApply = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={filterRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cyberpunk-neon-btn"
      >
        <Filter className="w-4 h-4 text-white" />
        Filters
        {(selectedGenres.length > 0 || selectedCreators.length > 0 || selectedStudios.length > 0 || 
          scoredBySort !== null || !showTvSeries || !showMovies || hideHentai) && (
          <span className="ml-1.5 flex h-2 w-2 rounded-full bg-[#4ef1d6]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 p-4 mt-2 backgroundMain border border-white/40 rounded-lg shadow-lg w-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">Filters</h3>
            
          </div>

          <div className="space-y-4">
            <div className="border-b pb-4">
              <h4 className="font-medium mb-2 text-white">Type</h4>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox" 
                    checked={showTvSeries}
                    onChange={(e) => setShowTvSeries(e.target.checked)}
                    className="hidden"
                  />
                  <span className="checkbox-custom rounded text-white"></span>
                  <span className="ml-2 text-sm text-white">TV Series</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMovies}
                    onChange={(e) => setShowMovies(e.target.checked)}
                    className="hidden"
                  />
                  <span className="checkbox-custom rounded text-white"></span>
                  <span className="ml-2 text-sm text-white">Movies</span>
                </label>
              </div>
              <div className="mt-2">
                <HentaiFilter
                  hideHentai={hideHentai}
                  setHideHentai={setHideHentai}
                />
              </div>
            </div>

            <div className="border-b pb-4">
              <GenreFilter
                selectedGenres={selectedGenres}
                setSelectedGenres={setSelectedGenres}
                onSelectionChange={(genres) => setSelectedGenres(genres)}
              />
            </div>

            <div className="border-b pb-4">
              <CreatorFilter
                selectedCreators={selectedCreators}
                setSelectedCreators={setSelectedCreators}
                onSelectionChange={(creators) => setSelectedCreators(creators)}
              />
            </div>

            <div className="border-b pb-4">
              <StudioFilter
                selectedStudios={selectedStudios}
                setSelectedStudios={setSelectedStudios}
                onSelectionChange={(studios) => setSelectedStudios(studios)}
              />
            </div>

            <div>
              <SortScoredBy
                scoredBySort={scoredBySort}
                setScoredBySort={setScoredBySort}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
          <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
            <button
              onClick={handleApply}
              className="cyberpunk-neon-btn blue"
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
