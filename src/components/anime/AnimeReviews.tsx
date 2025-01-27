import React from 'react';
import { ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';

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
  onPageChange: (page: number) => void;
  onReviewClick: (review: Review) => void;
}

export const AnimeReviews: React.FC<AnimeReviewsProps> = ({
  reviews,
  currentReviewPage,
  totalPages,
  reviewsPerPage,
  isLoading,
  onPageChange,
  onReviewClick,
}) => {
  const currentReviews = reviews.slice(
    (currentReviewPage - 1) * reviewsPerPage,
    currentReviewPage * reviewsPerPage
  );

  if (isLoading) {
    return <div className="animate-pulse">Loading reviews...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Reviews</h2>
      <div className="space-y-4">
        {currentReviews.map((review) => (
          <div
            key={review.mal_id}
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onReviewClick(review)}
          >
            <div className="flex items-center gap-3 mb-2">
              <img
                src={review.user.images.jpg.image_url}
                alt={review.user.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{review.user.username}</p>
                <p className="text-sm text-gray-600">{review.date}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">{review.reactions.nice}</span>
              </div>
            </div>
            <p className="text-sm line-clamp-3">{review.review}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => onPageChange(currentReviewPage - 1)}
            disabled={currentReviewPage === 1}
            className="p-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span>
            Page {currentReviewPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentReviewPage + 1)}
            disabled={currentReviewPage === totalPages}
            className="p-2 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
