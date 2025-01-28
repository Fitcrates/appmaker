import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { LazyLoad } from './LazyLoad';
import { AnimePreview } from './AnimePreview';
import { Pagination } from './Pagination';
import { useWatchlist } from '../hooks/useWatchlist';
import { Info, Bookmark } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';

interface PaginationData {
  has_next_page: boolean;
  last_visible_page: number;
  current_page: number;
}

interface TopAnimeProps {
  animeData: any[];
  pagination: PaginationData | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export function TopAnime({ animeData, pagination, currentPage, onPageChange, isLoading }: TopAnimeProps) {
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Top Anime</h2>
        
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {animeData.map((anime) => (
          <div key={anime.mal_id} className="relative group">
            <LazyLoad>
              <div
                className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-105"
                onClick={() => setSelectedAnime(anime)}
              >
                <img
                  src={anime.images.jpg.image_url}
                  alt={anime.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 rounded-full px-2 py-1 flex items-center">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="ml-1 text-sm text-white">{anime.score}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-2">{anime.title}</h3>
                </div>
              </div>
            </LazyLoad>

            <div className="absolute top-2 right-2 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <Tooltip content="View Details">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnime(anime);
                    }}
                    className="p-2 bg-black rounded-full shadow-md"
                  >
                    <Info className="w-4 h-4 text-white" />
                  </button>
                </Tooltip>
                <Tooltip content={isInWatchlist[anime.mal_id] ? "Remove from Watchlist" : "Add to Watchlist"}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      isInWatchlist[anime.mal_id]
                        ? removeFromWatchlist(anime.mal_id)
                        : addToWatchlist(anime);
                    }}
                    className="p-2 bg-black rounded-full shadow-md"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isInWatchlist[anime.mal_id] ? "text-blue-500 fill-current" : "text-white"
                      }`}
                    />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnime && (
        <AnimePreview
          anime={selectedAnime}
          isOpen={!!selectedAnime}
          onClose={() => setSelectedAnime(null)}
        />
      )}
      <Pagination
    currentPage={currentPage}
    totalPages={pagination?.last_visible_page || 1}
    onPageChange={onPageChange}
  />
    </div>
    
  );
}
