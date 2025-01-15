import React from 'react';
import { Star, X } from 'lucide-react';

interface AnimePreviewProps {
  anime: any;
  className?: string;
  onClose?: () => void;
}

export function AnimePreview({ anime, className = '', onClose }: AnimePreviewProps) {
  return (
    <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <X className="w-4 h-4 text-gray-600" />
      </button>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{anime.title}</h3>
      
        <div className="space-y-2">
          {/* Rating and Episodes */}
          <div className="flex items-center justify-between text-sm">
            <div className="px-2 py-1 bg-orange-100 rounded-lg mr-4">
              {anime.rating || 'No rating'}
            </div>
            <div>
              {anime.episodes ? `${anime.episodes} episodes` : 'Unknown episodes'}
            </div>
          </div>

          {/* Score */}
          {anime.score && (
            <div className="flex items-center space-x-1 text-sm">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>{anime.score}</span>
              {anime.scored_by && (
                <span className="text-gray-500">
                  ({(anime.scored_by / 1000).toFixed(1)}k votes)
                </span>
              )}
            </div>
          )}

          {/* Synopsis */}
          <p className="text-sm text-gray-600 line-clamp-4">
            {anime.synopsis || 'No synopsis available'}
          </p>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {anime.genres.map((genre: any) => (
                <span
                  key={genre.mal_id}
                  className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
