import React from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from '../../components/Pagination';

interface Recommendation {
  entry: {
    mal_id: number;
    title: string;
    images: {
      jpg: {
        image_url: string;
      }
    }
  };
}

interface AnimeRecommendationsProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
  hasLoaded?: boolean;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export const AnimeRecommendations: React.FC<AnimeRecommendationsProps> = ({ 
  recommendations, 
  isLoading = false, 
  hasLoaded = false,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange = () => {}
}) => {
  if (isLoading) {
    return (
      <div className="mt-8 min-h-[20rem] sm:min-h-[20rem] md:min-h-[20rem]">
        <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Recommendations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="animate-pulse bg-black/40 rounded-lg shadow-md flex flex-col ring-1 ring-white/20 min-h-[200px]">
              <div className="h-40 bg-black/20 rounded-t-lg"></div>
              <div className="p-2">
                <div className="h-4 bg-black/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-black/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasLoaded && !isLoading) {
    return (
      <div className="mt-8 min-h-[20rem] sm:min-h-[20rem] md:min-h-[20rem]">
        <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Recommendations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(itemsPerPage)].map((_, index) => (
            <div key={index} className="animate-pulse bg-black/40 rounded-lg shadow-md flex flex-col ring-1 ring-white/20 min-h-[200px]">
              <div className="h-40 bg-black/20 rounded-t-lg"></div>
              <div className="p-2">
                <div className="h-4 bg-black/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-black/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Recommendations</h2>
        <p className="text-white text-center py-8">No recommendations available.</p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(recommendations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, recommendations.length);
  const currentRecommendations = recommendations.slice(startIndex, endIndex);

  return (
    <div className="mt-8">
      <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4 break-words">
  Recommenda&shy;tions
</h2>


      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {currentRecommendations.map((recommendation) => (
          <Link 
            key={recommendation.entry.mal_id} 
            to={`/anime/${recommendation.entry.mal_id}`}
            className="bg-black/40 rounded-lg shadow-md flex flex-col hover:ring-1 hover:ring-[#ff13f0]/50 transition-all duration-300 ring-1 ring-white/20"
          >
            <img 
              src={recommendation.entry.images.jpg.image_url} 
              alt={recommendation.entry.title} 
              className="w-full h-40 object-cover rounded-t-lg"
              loading="lazy"
            />
            <div className="p-2">
              <h3 className="text-white text-sm font-medium line-clamp-2">{recommendation.entry.title}</h3>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isLoading={isLoading}
          className="mt-6"
        />
      )}
    </div>
  );
};
