import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';

interface AnimeCardProps {
  anime: any;
  isSelected?: boolean;
  onSelect?: (anime: any) => void;
  isForumMode?: boolean;
}

export function AnimeCard({ anime, isSelected, onSelect, isForumMode = false }: AnimeCardProps) {
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    if (isForumMode && onSelect) {
      e.preventDefault();
      onSelect(anime);
    }
  };

  return (
    <Link
      to={`/anime/${anime.mal_id}`}
      state={{ from: location }}
      className={`group ${isForumMode ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className={`bg-black/20 rounded-lg shadow-md overflow-hidden transition-transform h-[17rem] ${isSelected ? 'ring-2 ring-[#4ef1d6]' : ''}`}>
        <img
          src={anime.images.jpg.image_url}
          alt={anime.title}
          className="w-full h-[8rem] object-cover"
        />
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate text-white">{anime.title}</h3>
          <div className="flex items-center mt-2 text-sm text-white">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span>{anime.score || 'N/A'}</span>
            <span className="mx-2">•</span>
            <span>{anime.type || 'Unknown'}</span>
          </div>
          <p className="mt-2 text-sm text-white/80 line-clamp-2">{anime.synopsis}</p>
        </div>
      </div>
    </Link>
  );
}