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
}

export const AnimeRecommendations: React.FC<AnimeRecommendationsProps> = ({
  recommendations,
  isLoading,
}) => {
  if (isLoading) {
    return <div className="animate-pulse">Loading recommendations...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recommendations.map((rec) => (
          <Link
            key={rec.entry.mal_id}
            to={`/anime/${rec.entry.mal_id}`}
            className="block"
          >
            <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform hover:scale-105">
              <img
                src={rec.entry.images.jpg.image_url}
                alt={rec.entry.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-medium text-sm line-clamp-2">
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
