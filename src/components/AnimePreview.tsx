import React from 'react';
import { Star, X } from 'lucide-react';

interface AnimePreviewProps {
  anime: any;
  className?: string;
  onClose?: () => void;
}

export function AnimePreview({ anime, className = '', onClose }: AnimePreviewProps) {
  return (
    <div 
      className={`bg-white rounded-lg overflow-hidden shadow-lg relative ${className}`}
      onMouseLeave={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <X className="w-4 h-4 text-gray-600" />
      </button>

      <div className="p-4 pt-8">
        <h3 className="font-semibold text-lg mb-2">{anime.title}</h3>
        
        <div className="space-y-2">
          {/* Rating and Episodes */}
          <div className="flex items-center justify-between text-sm">
            <div className="px-2 py-1 bg-gray-100 rounded">
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

          {/* Status and Season */}
          <div className="text-sm space-y-1">
            <div>Status: <span className="text-gray-700">{anime.status || 'Unknown'}</span></div>
            {anime.season && (
              <div>Season: <span className="text-gray-700">{anime.season} {anime.year}</span></div>
            )}
          </div>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {anime.genres.map((genre: any) => (
                <span 
                  key={genre.mal_id}
                  className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {anime.synopsis && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 line-clamp-4">
                {anime.synopsis}
              </p>
            </div>
          )}

          {/* Airing Information */}
          {anime.aired && (
            <div className="text-xs text-gray-500 mt-2">
              {anime.aired.string}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
