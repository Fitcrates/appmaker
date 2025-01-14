import React from 'react';
import { Star } from 'lucide-react';

interface AnimePreviewProps {
  anime: {
    title: string;
    synopsis?: string;
    score?: number;
    genres?: Array<{ name: string }>;
    aired?: {
      string?: string;
    };
    status?: string;
    images?: {
      jpg?: {
        image_url?: string;
      };
    };
  };
  className?: string;
}

export function AnimePreview({ anime, className = '' }: AnimePreviewProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`} style={{ width: '300px' }}>
      {/* Image */}
      {anime.images?.jpg?.image_url && (
        <div className="relative h-40 bg-gray-200">
          <img
            src={anime.images.jpg.image_url}
            alt={anime.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{anime.title}</h3>
        
        {/* Score */}
        {anime.score && (
          <div className="flex items-center mb-2">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span>{anime.score}</span>
          </div>
        )}

        {/* Status & Aired */}
        {(anime.status || anime.aired?.string) && (
          <div className="text-sm text-gray-600 mb-2">
            {anime.status && <div>{anime.status}</div>}
            {anime.aired?.string && <div>{anime.aired.string}</div>}
          </div>
        )}

        {/* Genres */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {anime.genres.map((genre) => (
              <span
                key={genre.name}
                className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}

        {/* Synopsis */}
        {anime.synopsis && (
          <p className="text-sm text-gray-600 line-clamp-3">{anime.synopsis}</p>
        )}
      </div>
    </div>
  );
}
