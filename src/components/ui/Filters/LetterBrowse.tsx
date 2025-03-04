import React, { memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Pagination } from '../../Pagination';
import { AnimeCard } from '../../AnimeCard';

interface AnimeBasic {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  rating?: string;
}

interface LetterBrowseProps {
  alphabet: string[];
  selectedLetter: string | null;
  onLetterClick: (letter: string) => void;
  showLetterNav: boolean;
  setShowLetterNav: (show: boolean) => void;
  letterAnimeList: AnimeBasic[];
  loadMore: () => void;
  hasMore: boolean;
  isLetterLoading: boolean;
  selectedAnime: AnimeBasic | null;
  onAnimeSelect: (anime: AnimeBasic) => void;
  onAnimeCardClick: (anime: AnimeBasic) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showResults: boolean;
}

// Use React.memo to prevent unnecessary re-renders
export const LetterBrowse = memo(function LetterBrowse({
  alphabet,
  selectedLetter,
  onLetterClick,
  showLetterNav,
  setShowLetterNav,
  letterAnimeList,
  loadMore,
  hasMore,
  isLetterLoading,
  selectedAnime,
  onAnimeSelect,
  onAnimeCardClick,
  currentPage,
  totalPages,
  onPageChange,
  showResults
}: LetterBrowseProps) {
  
  const handleAnimeSelect = (anime: AnimeBasic) => {
    // Prevent redundant state updates
    if (selectedAnime?.mal_id === anime.mal_id) return;
    
    onAnimeSelect(anime);
    onAnimeCardClick(anime);
  };

  const handleLetterSelection = (letter: string) => {
    // Prevent selecting the same letter
    if (letter === selectedLetter) return;
    onLetterClick(letter);
  };

  const handlePageSelection = (page: number) => {
    // Prevent selecting the same page
    if (page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div className="mb-8">
      {/* Browse by Letter Toggle */}
      <button
        onClick={() => setShowLetterNav(!showLetterNav)}
        className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg ring-1 ring-white/40 text-white"
      >
        Browse by Letter
        {showLetterNav ? (
          <ChevronUp className="w-4 h-4 transition-transform duration-300" />
        ) : (
          <ChevronDown className="w-4 h-4 transition-transform duration-300" />
        )}
      </button>

      {/* Letter Navigation */}
      <div className={`transform transition-all duration-300 ease-in-out overflow-hidden ${showLetterNav ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterSelection(letter)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                  selectedLetter === letter
                    ? 'cyberpunk-neon2-btn text-white'
                    : 'cyberpunk-neon2-btn pink'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Anime Grid */}
        {showResults && selectedLetter && (
          <div className={`mt-6 transform transition-all duration-300 ease-in-out ${showResults ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {isLetterLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin h-8 w-8 border-4 border-[#4ef1d6] border-t-transparent rounded-full"></div>
              </div>
            ) : letterAnimeList.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {letterAnimeList.map((anime) => (
                    <AnimeCard
                      key={anime.mal_id}
                      anime={anime}
                      isSelected={selectedAnime?.mal_id === anime.mal_id}
                      onSelect={handleAnimeSelect}
                      isForumMode={true}
                    />
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageSelection}
                      isLoading={isLetterLoading}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">No results found for letter {selectedLetter}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default LetterBrowse;
