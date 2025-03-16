import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface SortScoredByProps {
  scoredBySort: 'asc' | 'desc' | null;
  setScoredBySort: (sort: 'asc' | 'desc' | null) => void;
}

export const SortScoredBy: React.FC<SortScoredByProps> = ({
  scoredBySort,
  setScoredBySort
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);

  const handleSortChange = (sort: 'asc' | 'desc' | null) => {
    setScoredBySort(sort);
    setIsDropdownOpen(false);
  };

  const getSortText = () => {
    if (!scoredBySort) return 'By popularity';
    return scoredBySort === 'desc' ? 'Most Popular' : 'Least Popular';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center py-2 px-4 ml-4 ring-1 ring-white/40 shadow-lg text-white rounded-lg gap-2 hover:shadow-lg min-w-[130px]"
      >
        {getSortText()}
        <ChevronDown className="h-4 w-4 ml-auto" />
      </button>

      {isDropdownOpen && (
        <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg backgroundMain ring-1 ring-white/40 ">
          <div className="py-1">
            <button
              onClick={() => handleSortChange('desc')}
              className={`block w-full text-left px-4 py-2 text-sm text-white hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] ${
                scoredBySort === 'desc' ? 'text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6]' : ''
              }`}
            >
              Most Popular
            </button>
            <button
              onClick={() => handleSortChange('asc')}
              className={`block w-full text-left px-4 py-2 text-sm text-white hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] ${
                scoredBySort === 'asc' ? 'text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6]' : ''
              }`}
            >
              Least Popular
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
