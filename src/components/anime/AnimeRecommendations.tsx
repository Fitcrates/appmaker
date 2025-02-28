import React from 'react';
import { Link } from 'react-router-dom';

interface AnimeRecommendation {
  entry: {
    mal_id: number;
    title: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
  };
}

interface AnimeRecommendationsProps {
  recommendations: AnimeRecommendation[];
  isLoading: boolean;
  hasLoaded: boolean;
}

export const AnimeRecommendations: React.FC<AnimeRecommendationsProps> = ({
  recommendations,
  isLoading,
  hasLoaded,
}) => {
  if (!hasLoaded && !isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48 mb-2"></div>
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

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-white">
        No recommendations found for this anime.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="bg-clip-text text-[#EC4899] drop-shadow-[0_0_8px_#fa448c] tilt-neon mb-4">Recommendations</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recommendations.slice(0, 12).map((rec) => (
          <Link
            key={rec.entry.mal_id}
            to={`/anime/${rec.entry.mal_id}`}
            className="block group"
          >
            <div className="bg-black/20 rounded-lg shadow-sm overflow-hidden  group-hover:scale-105 duration-200 ring-1 ring-white/20">
              <img
                src={rec.entry.images.jpg.image_url || '/placeholder-anime.png'}
                alt={rec.entry.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-anime.png';
                }}
              />
              <div className="p-4">
                <h3 className="font-medium text-sm text-white line-clamp-2">
                  {rec.entry.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
