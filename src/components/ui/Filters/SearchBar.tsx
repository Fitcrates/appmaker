import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (page: number) => void;
  isSearching: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearching
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        handleSearch(1);
      }
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      handleSearch(1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // Trigger a search with empty query to reset results
    handleSearch(1);
  };

  return (
    <div className="max-w-md">
      <div className="relative flex gap-2  flex-col sm:flex-row  mx-auto">
        <div className="relative flex-1  mx-auto justify-left items-start ">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search anime..."
            className="w-full px-4 py-2 pl-10 pr-10 text-white bg-white/15 placeholder:text-white rounded-lg focus:outline-none  ring-1 ring-white/70"
            disabled={isSearching}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white" />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white hover:text-gray-600 transition-colors duration-200"
              aria-label="Clear search"
              disabled={isSearching}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleSearchClick}
          className=" flex-col sm:flex-row justify-center items-center sm:justify-between mx-auto cyberpunk-neon-btn blue "
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
};
