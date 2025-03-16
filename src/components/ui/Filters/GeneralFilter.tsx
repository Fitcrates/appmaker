import { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';
import { GenreFilter } from './GenreFilter';
import { CreatorFilter } from './CreatorFilter';
import { StudioFilter } from './StudioFilter';
import { SortScoredBy } from './SortScoredBy';
import { HentaiFilter } from './HentaiFilter';
import { useAnimeStore } from '../../../store/animeStore';

export function GeneralFilter() {
  const {
    selectedGenres,
    selectedCreators,
    selectedStudios,
    scoredBySort,
    showTvSeries,
    showMovies,
    hideHentai,
    setSelectedGenres,
    setSelectedCreators,
    setSelectedStudios,
    setScoredBySort,
    setShowTvSeries,
    setShowMovies,
    setHideHentai,
    resetFilters,
    setSearchQuery
  } = useAnimeStore();

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

  const handleApply = () => {
    setIsOpen(false);
  };

  const handleClearAll = () => {
    resetFilters();
    setSearchQuery(''); // Clear search query when clearing all filters
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
                onSelectionChange={setSelectedGenres}
              />
            </div>

            <div className="border-b pb-4">
              <CreatorFilter
                onSelectionChange={setSelectedCreators}
              />
            </div>

            <div className="border-b pb-4">
              <StudioFilter
                onSelectionChange={setSelectedStudios}
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
