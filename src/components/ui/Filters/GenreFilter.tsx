import React, { useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useGenreFilter, Genre } from '../../../hooks/useGenreFilter';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface GenreFilterProps {
  onSelectionChange?: (genres: Genre[]) => void;
  setCurrentPage?: (page: number) => void;
}

export const GenreFilter: React.FC<GenreFilterProps> = ({
  onSelectionChange,
  setCurrentPage
}) => {
  const {
    genres,
    selectedGenres,
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setIsDropdownOpen,
    isGenresLoading,
    handleGenreSelect,
    clearGenres
  } = useGenreFilter();

  const genreDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(genreDropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);

  const handleSelect = (genre: Genre) => {
    handleGenreSelect(genre);
    if (onSelectionChange) {
      const updatedGenres = selectedGenres.some(g => g.id === genre.id)
        ? selectedGenres.filter(g => g.id !== genre.id)
        : [...selectedGenres, genre];
      onSelectionChange(updatedGenres);
    }
    if (setCurrentPage) {
      setCurrentPage(1);
    }
  };

  const handleClearAll = () => {
    clearGenres();
    if (onSelectionChange) {
      onSelectionChange([]);
    }
    if (setCurrentPage) {
      setCurrentPage(1);
    }
  };

  return (
    <div ref={genreDropdownRef} className="relative">
      <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center py-2 px-4 ml-4 ring-1 ring-white/40 shadow-lg  text-white rounded-lg gap-2 hover:shadow-lg  min-w-[130px]">
        <span>{selectedGenres.length > 0 ? `${selectedGenres.length} genres selected` : 'By genre'}</span>
        <ChevronDown className="h-4 w-4 ml-auto" />
      </button>

      {isDropdownOpen && (
        <div className="absolute z-10 mt-2 w-64 backgroundMain rounded-lg shadow-lg border">
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search genres..."
              className="w-full px-3 py-2 bg-white/20 ring-1 ring-white/40 rounded-lg text-white placeholder-white/80"
            />
          </div>

          {/* Selected Genres */}
          {selectedGenres.length > 0 && (
            <div className="px-2 pb-2 border-b">
              <div className="flex flex-wrap gap-1">
                {selectedGenres.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center ring-2 bg-black/30 text-white  text-sm px-2 py-1 rounded-full"
                  >
                    <span className="mr-1">{genre.name}</span>
                    <button
                      onClick={() => handleSelect(genre)}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {isGenresLoading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : genres.length > 0 ? (
              genres.map((genre) => (
                <label
                  key={genre.id}
                  className="flex items-start px-4 py-2  cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.some(g => g.id === genre.id)}
                    onChange={() => handleSelect(genre)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-white bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6]">{genre.name}</div>
                    {genre.count !== undefined && genre.count > 0 && (
                      <div className="text-xs text-white/80">{genre.count} anime</div>
                    )}
                  </div>
                </label>
              ))
            ) : (
              <div className="px-4 py-2 text-white">No genres found</div>
            )}
          </div>

          {selectedGenres.length > 0 && (
            <div className="p-2 border-t">
              <button
                onClick={handleClearAll}
                className="w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Clear Selection ({selectedGenres.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
