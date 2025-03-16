import React from 'react';
import { ThumbsUp, Star } from 'lucide-react';
import { Pagination } from '../Pagination';

interface Review {
  mal_id: number;
  type: string;
  reactions: {
    nice: number;
    love_it: number;
    funny: number;
  };
  date: string;
  review: string;
  score: number;
  tags: string[];
  user: {
    username: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
  };
}

interface AnimeReviewsProps {
  reviews: Review[];
  currentReviewPage: number;
  reviewsPerPage: number;
  isLoading: boolean;
  hasLoaded: boolean;
  onPageChange: (page: number) => void;
  onReviewClick: (review: Review) => void;
}

export const AnimeReviews: React.FC<AnimeReviewsProps> = ({
  reviews,
  currentReviewPage,
  reviewsPerPage,
  isLoading,
  hasLoaded,
  onPageChange,
  onReviewClick,
}) => {
  // Calculate start and end indices for current page
  const startIndex = (currentReviewPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

  // Calculate actual total pages based on reviews length
  const actualTotalPages = Math.ceil(reviews.length / reviewsPerPage);

  if (!hasLoaded && !isLoading) {
    return (
      <div className="mt-8 min-h-[30rem] sm:min-h-[40rem] md:min-h-[50rem]">
        <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-black/40 rounded-lg shadow-md p-6 flex flex-col animate-pulse ring-1 ring-white/20 min-h-[200px]">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-black/20 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-black/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-black/20 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 flex-grow">
                <div className="h-3 bg-black/20 rounded w-full"></div>
                <div className="h-3 bg-black/20 rounded w-full"></div>
                <div className="h-3 bg-black/20 rounded w-3/4"></div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="h-6 bg-black/20 rounded w-20"></div>
                <div className="h-6 bg-black/20 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-8 min-h-[20rem] sm:min-h-[20rem] md:min-h-[20rem]">
        <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-black/40 rounded-lg shadow-md p-6 flex flex-col animate-pulse ring-1 ring-white/20 min-h-[200px]">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-black/20 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-black/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-black/20 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 flex-grow">
                <div className="h-3 bg-black/20 rounded w-full"></div>
                <div className="h-3 bg-black/20 rounded w-full"></div>
                <div className="h-3 bg-black/20 rounded w-3/4"></div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="h-6 bg-black/20 rounded w-20"></div>
                <div className="h-6 bg-black/20 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Reviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentReviews.map((review) => (
          <div
            key={review.mal_id}
            className="bg-black/40 rounded-lg shadow-md p-6 flex flex-col hover:ring-1 hover:ring-[#ff13f0]/50 transition-all duration-300 ring-1 ring-white/20"
            onClick={() => onReviewClick(review)}
          >
            <div className="flex items-center mb-4">
              <img
                src={review.user?.images?.jpg?.image_url || '/placeholder-avatar.png'}
                alt={review.user?.username || 'Anonymous'}
                className="w-10 h-10 rounded-full mr-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-avatar.png';
                }}
              />
              <div>
                <div className="font-medium text-white">{review.user?.username || 'Anonymous'}</div>
                <div className="text-sm text-white">
                  {review.date ? new Date(review.date).toLocaleDateString() : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-white notranslate">{review.score ?? 'N/A'}</span>
              </div>
              {review.tags && review.tags.length > 0 && (
                <div className="ml-4 flex flex-wrap gap-1">
                  {review.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] px-2 py-1 rounded text-black font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-white text-sm line-clamp-4 mb-4 flex-grow">
              {review.review}
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t">
              <div className="flex items-center gap-4">
                {review.reactions && (
                  <>
                    <div className="flex items-center text-sm text-white">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      <span className="notranslate">{review.reactions.nice || 0}</span>
                    </div>
                    <div className="flex items-center text-sm text-white">
                      <span>❤️ <span className="notranslate">{review.reactions.love_it || 0}</span></span>
                    </div>
                    <div className="flex items-center text-sm text-white">
                      <span>😄 <span className="notranslate">{review.reactions.funny || 0}</span></span>
                    </div>
                  </>
                )}
              </div>
              <span className="text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon2">
                Read More
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <Pagination
          currentPage={currentReviewPage}
          totalPages={Math.max(1, actualTotalPages)}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
