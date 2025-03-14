import React from 'react';
import { Play } from 'lucide-react';

interface AnimeTrailerProps {
  trailer?: {
    youtube_id?: string;
    embed_url?: string;
    url?: string;
  };
  onTrailerClick?: () => void;
}

export function AnimeTrailer({ trailer, onTrailerClick }: AnimeTrailerProps) {
  if (!trailer?.youtube_id) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTrailerClick) {
      onTrailerClick();
    }
  };

  return (
    <div 
      className="relative group cursor-pointer rounded-lg overflow-hidden"
      onClick={handleClick}
      style={{ maxWidth: '400px' }}
    >
      <div className="relative aspect-video">
        <img
          src={`https://img.youtube.com/vi/${trailer.youtube_id}/maxresdefault.jpg`}
          alt="Trailer thumbnail"
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://img.youtube.com/vi/${trailer.youtube_id}/hqdefault.jpg`;
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center group-hover:bg-opacity-40 transition-opacity">
          <div className="bg-white rounded-full p-3 transform group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
