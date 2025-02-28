import React, { useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useCreatorFilter, Creator } from '../../../hooks/useCreatorFilter';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface CreatorFilterProps {
  onSelectionChange?: (creators: Creator[]) => void;
  setCurrentPage?: (page: number) => void;
}

export const CreatorFilter: React.FC<CreatorFilterProps> = ({
  onSelectionChange,
  setCurrentPage
}) => {
  const {
    creators,
    selectedCreators,
    creatorSearchTerm,
    setCreatorSearchTerm,
    isCreatorDropdownOpen,
    setIsCreatorDropdownOpen,
    isCreatorsLoading,
    handleCreatorSelect,
    clearCreators
  } = useCreatorFilter();

  const creatorDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(creatorDropdownRef, () => setIsCreatorDropdownOpen(false), isCreatorDropdownOpen);

  const handleSelect = (creator: Creator) => {
    handleCreatorSelect(creator);
    if (onSelectionChange) {
      const updatedCreators = selectedCreators.some(c => c.mal_id === creator.mal_id)
        ? selectedCreators.filter(c => c.mal_id !== creator.mal_id)
        : [...selectedCreators, creator];
      onSelectionChange(updatedCreators);
    }
    if (setCurrentPage) {
      setCurrentPage(1);
    }
  };

  const handleClearAll = () => {
    clearCreators();
    if (onSelectionChange) {
      onSelectionChange([]);
    }
    if (setCurrentPage) {
      setCurrentPage(1);
    }
  };

  return (
    <div ref={creatorDropdownRef} className="relative">
      <button onClick={() => setIsCreatorDropdownOpen(!isCreatorDropdownOpen)} className="flex items-center py-2 px-4 ml-4 ring-1 ring-white/40 shadow-lg text-white rounded-lg gap-2 hover:shadow-lg min-w-[130px]">
        <span>{selectedCreators.length > 0 ? `${selectedCreators.length} creators selected` : 'By creator'}</span>
        <ChevronDown className="h-4 w-4 ml-auto" />
      </button>

      {isCreatorDropdownOpen && (
        <div className="absolute z-10 mt-2 w-64 backgroundMain rounded-lg shadow-lg border">
          <div className="p-2">
            <input
              type="text"
              value={creatorSearchTerm}
              onChange={(e) => setCreatorSearchTerm(e.target.value)}
              placeholder="Search creators..."
              className="w-full px-3 py-2 bg-white/20 ring-1 ring-white/40 rounded-lg text-white placeholder-white/80"
            />
          </div>

          {/* Selected Creators */}
          {selectedCreators.length > 0 && (
            <div className="px-2 pb-2 border-b">
              <div className="flex flex-wrap gap-1">
                {selectedCreators.map((creator) => (
                  <div
                    key={creator.mal_id}
                    className="flex items-center ring-2 bg-black/30 text-white text-sm px-2 py-1 rounded-full"
                  >
                    <span className="mr-1">{creator.name}</span>
                    <span className="mr-1">{creator.about}</span>
                    <button
                      onClick={() => handleSelect(creator)}
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
            {isCreatorsLoading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : creators.length > 0 ? (
              creators.map((creator) => (
                <label
                  key={creator.mal_id}
                  className="flex items-start px-4 py-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCreators.some(c => c.mal_id === creator.mal_id)}
                    onChange={() => handleSelect(creator)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-white bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6]">{creator.name}</div>
                    {creator.about && (
                      <div className="text-xs text-white/80">{creator.about}</div>
                    )}
                  </div>
                </label>
              ))
            ) : (
              <div className="px-4 py-2 text-white">No creators found</div>
            )}
          </div>

          {selectedCreators.length > 0 && (
            <div className="p-2 border-t">
              <button
                onClick={handleClearAll}
                className="w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Clear Selection ({selectedCreators.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
