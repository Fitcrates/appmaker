import React, { useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useStudioFilter, Studio } from '../../../hooks/useStudioFilter';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface StudioFilterProps {
  onSelectionChange?: (studios: Studio[]) => void;
  setCurrentPage?: (page: number) => void;
}

export const StudioFilter: React.FC<StudioFilterProps> = ({
  onSelectionChange,
  setCurrentPage
}) => {
  const {
    studios,
    selectedStudios,
    studioSearchTerm,
    setStudioSearchTerm,
    isStudioDropdownOpen,
    setIsStudioDropdownOpen,
    isStudiosLoading,
    handleStudioSelect,
    clearStudios
  } = useStudioFilter();

  const studioDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(studioDropdownRef, () => setIsStudioDropdownOpen(false), isStudioDropdownOpen);

  const handleSelect = (studio: Studio) => {
    handleStudioSelect(studio);
    if (onSelectionChange) {
      const updatedStudios = selectedStudios.some(s => s.mal_id === studio.mal_id)
        ? selectedStudios.filter(s => s.mal_id !== studio.mal_id)
        : [...selectedStudios, studio];
      onSelectionChange(updatedStudios);
      if (setCurrentPage) {
        setCurrentPage(1);
      }
    }
  };

  const handleClearAll = () => {
    clearStudios();
    if (onSelectionChange) {
      onSelectionChange([]);
      if (setCurrentPage) {
        setCurrentPage(1);
      }
    }
  };

  const filteredStudios = studios.filter(studio =>
    !selectedStudios.some(s => s.mal_id === studio.mal_id) &&
    studio.name.toLowerCase().includes(studioSearchTerm.toLowerCase())
  );

  return (
    <div ref={studioDropdownRef} className="relative">
      <button onClick={() => setIsStudioDropdownOpen(!isStudioDropdownOpen)} className="flex items-center py-2 px-4 ml-4 ring-1 ring-white/40 shadow-lg text-white rounded-lg gap-2 hover:shadow-lg min-w-[130px]">
        <span>{selectedStudios.length > 0 ? `${selectedStudios.length} studios selected` : 'By studio'}</span>
        <ChevronDown className="h-4 w-4 ml-auto" />
      </button>

      {isStudioDropdownOpen && (
        <div className="absolute z-10 mt-2 w-64 backgroundMain rounded-lg shadow-lg border">
          <div className="p-2">
            <input
              type="text"
              value={studioSearchTerm}
              onChange={(e) => setStudioSearchTerm(e.target.value)}
              placeholder="Search studios..."
              className="w-full px-3 py-2 bg-white/20 ring-1 ring-white/40 rounded-lg text-white placeholder-white/80"
            />
          </div>

          {/* Selected Studios */}
          {selectedStudios.length > 0 && (
            <div className="px-2 pb-2 border-b">
              <div className="flex flex-wrap gap-1">
                {selectedStudios.map((studio) => (
                  <div
                    key={studio.mal_id}
                    className="flex items-center ring-2 bg-black/30 text-white text-sm px-2 py-1 rounded-full"
                  >
                    <span className="mr-1">{studio.name}</span>
                    <button
                      onClick={() => handleSelect(studio)}
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
            {isStudiosLoading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : studios.length > 0 ? (
              studios.map((studio) => (
                <label
                  key={studio.mal_id}
                  className="flex items-start px-4 py-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudios.some(s => s.mal_id === studio.mal_id)}
                    onChange={() => handleSelect(studio)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-white bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6]">{studio.name}</div>
                  </div>
                </label>
              ))
            ) : (
              <div className="px-4 py-2 text-white">No studios found</div>
            )}
          </div>

          {selectedStudios.length > 0 && (
            <div className="p-2 border-t">
              <button
                onClick={handleClearAll}
                className="w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Clear Selection ({selectedStudios.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
