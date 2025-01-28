import React from 'react';
import { Link } from 'react-router-dom';

interface Character {
  character: {
    mal_id: number;
    name: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
  };
  role: string;
}

interface AnimeCharactersProps {
  characters: Character[];
  isLoading: boolean;
  hasLoaded: boolean;
}

export const AnimeCharacters: React.FC<AnimeCharactersProps> = ({ 
  characters, 
  isLoading,
  hasLoaded
}) => {
  if (!hasLoaded && !isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-40 mb-2"></div>
            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No characters found for this anime.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Characters</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {characters.slice(0, 12).map((char) => (
          <Link
            key={char.character.mal_id}
            to={`/character/${char.character.mal_id}`}
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
              <img
                src={char.character.images.jpg.image_url || '/placeholder-avatar.png'}
                alt={char.character.name}
                className="w-full h-40 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-avatar.png';
                }}
              />
              <div className="p-2">
                <h3 className="font-medium text-sm line-clamp-2">{char.character.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{char.role}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
