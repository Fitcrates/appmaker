import React from 'react';
import { Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const location = useLocation();
  
  return (
    <Link 
      to={`/anime/${anime.mal_id}`} 
      state={{ from: location }}
      className="group"
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:scale-105">
        <img
          src={anime.images.jpg.image_url}
          alt={anime.title}
          className="w-full h-64 object-cover"
        />
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{anime.title}</h3>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span>{anime.score || 'N/A'}</span>
            <span className="mx-2">•</span>
            <span>{anime.year || 'N/A'}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{anime.synopsis}</p>
        </div>
      </div>
    </Link>
  );
}