import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Pagination } from '../Pagination';
import { fetchFromAPI, RequestPriority } from '../../utils/api';
import { saveNavigationState, getNavigationState } from '../../utils/navigationState';

interface Character {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
}

interface AnimeCharactersProps {
  animeId?: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
}

export const AnimeCharacters: React.FC<AnimeCharactersProps> = ({ animeId }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const CHARACTERS_PER_PAGE = 12;

  // Initialize from saved state
  useEffect(() => {
    const savedState = getNavigationState();
    if (savedState?.source?.component === 'AnimeCharacters' && savedState?.page) {
      setCurrentPage(savedState.page);
    }
  }, []);

  // Save state when page changes
  useEffect(() => {
    if (currentPage > 0) {  // Only save if page is valid
      saveNavigationState({
        pathname: location.pathname,
        search: location.search,
        page: currentPage,
        source: {
          component: 'AnimeCharacters'
        }
      });
    }
  }, [currentPage, location.pathname, location.search]);

  useEffect(() => {
    saveNavigationState({
      pathname: location.pathname,
      search: location.search,
      page: currentPage
    });
  }, [location.pathname, location.search, currentPage]);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!animeId) {
        setError('Anime ID is missing.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchFromAPI(`/anime/${animeId}/characters`, RequestPriority.High);

        if (response?.data) {
          setCharacters(response.data);
          setTotalPages(Math.ceil(response.data.length / CHARACTERS_PER_PAGE));
        } else {
          setError('No character data available.');
        }
      } catch (err) {
        setError('Failed to load characters.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacters();
  }, [animeId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!animeId) {
    return <div className="text-center text-red-500 p-4">Error: Anime ID is missing.</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  const indexOfLastCharacter = currentPage * CHARACTERS_PER_PAGE;
  const indexOfFirstCharacter = indexOfLastCharacter - CHARACTERS_PER_PAGE;
  const currentCharacters = characters.slice(indexOfFirstCharacter, indexOfLastCharacter);

  return (
    <div className="mt-16">
      <h2 className="mb-4 bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon">Personas</h2>
    
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : characters.length > 0 ? (
        <div className="flex flex-col space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 ">
            {currentCharacters.map((char) => (
              <Link
                key={char.character.mal_id}
                to={`/character/${char.character.mal_id}`}
                state={{ fromAnimeId: animeId }}
                className="block group"
              >
                <div className="bg-black/20 rounded-lg shadow-sm overflow-hidden 
                hover:ring-1 hover:ring-[#ff13f0]/50 transition-all duration-300 group-hover:shadow-md group-hover:scale-105 ring-1 ring-white/20 h-[15rem] md:h-[18rem]">
                <img
                    src={char.character.images.jpg.image_url || '/placeholder-avatar.png'}
                    alt={char.character.name}
                    className="w-full h-2/3 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-avatar.png';
                    }}
                  />
                  <div className="p-2">
                    <h3 className="font-medium text-sm text-white line-clamp-2">{char.character.name}</h3>
                    <p className="text-xs text-white mt-1">{char.role}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-white">No characters found for this anime.</div>
      )}
    </div>
  );
};
