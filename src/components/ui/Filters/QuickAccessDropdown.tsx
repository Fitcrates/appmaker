import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

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

interface QuickAccessDropdownProps {
  topAnime: AnimeBasic[];
  setSelectedAnime: (anime: AnimeBasic) => void;
  selectedAnime?: AnimeBasic | null;
  onAnimeSelect?: (anime: AnimeBasic) => void;
}

export function QuickAccessDropdown({ topAnime, setSelectedAnime, selectedAnime, onAnimeSelect }: QuickAccessDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayedAnime, setDisplayedAnime] = useState<AnimeBasic[]>([]);

  // Ensure we're displaying all anime items
  useEffect(() => {
    console.log('QuickAccessDropdown received topAnime:', topAnime.length, 'items');
    setDisplayedAnime(topAnime);
  }, [topAnime]);

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (anime: AnimeBasic) => {
    setSelectedAnime(anime);
    setIsOpen(false); // Close the dropdown after selection
    onAnimeSelect?.(anime); // Call the onAnimeSelect callback if provided
  };

  return (
    <div className="relative flex-shrink-0 w-full sm:w-64">
      <button
        onClick={handleButtonClick}
        className="w-full p-3 ring-2 ring-white/40 rounded-lg text-md text-white flex justify-between items-center"
      > 
        <span>{selectedAnime ? selectedAnime.title : `Quick access (Top ${displayedAnime.length})`}</span>
        <ChevronDown className="w-4 h-4 text-white" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 backgroundMain rounded-lg shadow-lg ring-1 ring-white/40 max-h-96 overflow-y-auto">
          {displayedAnime.map((anime, index) => (
            <button
              key={anime.mal_id}
              onClick={() => handleOptionClick(anime)}
              className="w-full text-left p-3 text-white hover:bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] px-3 py-2 rounded-md text-sm font-medium"
            >
              {anime.title}
            </button>
          ))}
          {displayedAnime.length === 0 && (
            <div className="p-3 text-white text-center">Loading...</div>
          )}
        </div>
      )}
    </div>
  );
}
