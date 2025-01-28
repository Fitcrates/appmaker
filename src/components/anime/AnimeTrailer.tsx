import React from 'react';
import { Play } from 'lucide-react';

interface AnimeTrailerProps {
  youtubeId: string;
  embedUrl: string;
  onTrailerClick: () => void;
}

export const AnimeTrailer: React.FC<AnimeTrailerProps> = ({
  youtubeId,
  embedUrl,
  onTrailerClick,
}) => {
  if (!youtubeId) return null;

  return (
    <div className="relative group cursor-pointer w-[300px]" onClick={onTrailerClick}>
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
          alt="Trailer thumbnail"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
          }}
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-700 transition-colors flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
