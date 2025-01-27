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
}

export const AnimeCharacters: React.FC<AnimeCharactersProps> = ({ characters, isLoading }) => {
  if (isLoading) {
    return <div className="animate-pulse">Loading characters...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Characters</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {characters.map((char) => (
          <Link
            key={char.character.mal_id}
            to={`/character/${char.character.mal_id}`}
            className="block"
          >
            <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform hover:scale-105">
              <img
                src={char.character.images.jpg.image_url}
                alt={char.character.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-2">
                <h3 className="font-medium text-sm line-clamp-2">{char.character.name}</h3>
                <p className="text-xs text-gray-600">{char.role}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
