import React from 'react';
import { ChevronLeft, ChevronRight, ThumbsUp, Star } from 'lucide-react';

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
  totalPages: number;
  reviewsPerPage: number;
  isLoading: boolean;
  hasLoaded: boolean;
  onPageChange: (page: number) => void;
  onReviewClick: (review: Review) => void;
}

export const AnimeReviews: React.FC<AnimeReviewsProps> = ({
  reviews,
  currentReviewPage,
  totalPages,
  reviewsPerPage,
  isLoading,
  hasLoaded,
  onPageChange,
  onReviewClick,
}) => {
  const currentReviews = reviews.slice(
    (currentReviewPage - 1) * reviewsPerPage,
    currentReviewPage * reviewsPerPage
  );

  if (!hasLoaded && !isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse bg-white rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
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

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">Reviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentReviews.map((review) => (
          <div
            key={review.mal_id}
            className="bg-white rounded-lg shadow-md p-6 flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
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
                <div className="font-medium">{review.user?.username || 'Anonymous'}</div>
                <div className="text-sm text-gray-500">
                  {review.date ? new Date(review.date).toLocaleDateString() : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span>{review.score ?? 'N/A'}</span>
              </div>
              {review.tags && review.tags.length > 0 && (
                <div className="ml-4 flex flex-wrap gap-1">
                  {review.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm line-clamp-4 mb-4 flex-grow">
              {review.review}
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t">
              <div className="flex items-center gap-4">
                {review.reactions && (
                  <>
                    <div className="flex items-center text-sm text-gray-500">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      <span>{review.reactions.nice || 0}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>❤️ {review.reactions.love_it || 0}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>😄 {review.reactions.funny || 0}</span>
                    </div>
                  </>
                )}
              </div>
              <span className="text-blue-600 hover:text-blue-800 text-sm">
                Read More
              </span>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-2">
          <button
            onClick={() => onPageChange(currentReviewPage - 1)}
            disabled={currentReviewPage === 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="mx-4">
            Page {currentReviewPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentReviewPage + 1)}
            disabled={currentReviewPage === totalPages}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
