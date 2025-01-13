import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ThumbsUp, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Anime } from '../types';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Modal } from '../components/Modal';

interface Character {
  character: {
    mal_id: number;
    name: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
  };
  role: string;
}

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

interface AnimeCardProps {
  anime: {
    mal_id: number;
    title: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
  };
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => (
  <Link to={`/anime/${anime.mal_id}`} className="block">
    <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform hover:scale-105">
      <img
        src={anime.images.jpg.image_url}
        alt={anime.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-2">{anime.title}</h3>
      </div>
    </div>
  </Link>
);

export function AnimePage() {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const currentReviews = reviews.slice(
    (currentReviewPage - 1) * reviewsPerPage,
    currentReviewPage * reviewsPerPage
  );

  useEffect(() => {
    let isSubscribed = true;

    const fetchAnimeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Fetch main anime data with HIGH priority
        const animeData = await fetchFromAPI<any>(`/anime/${id}/full`, {}, RequestPriority.HIGH);
        if (!isSubscribed) return;
        setAnime(animeData.data);

        // Fetch other data with MEDIUM priority
        const [charactersData, reviewsData, recommendationsData] = await Promise.all([
          fetchFromAPI<any>(`/anime/${id}/characters`, {}, RequestPriority.MEDIUM),
          fetchFromAPI<any>(`/anime/${id}/reviews`, {}, RequestPriority.MEDIUM),
          fetchFromAPI<any>(`/anime/${id}/recommendations`, {}, RequestPriority.MEDIUM)
        ]);

        if (!isSubscribed) return;
        setCharacters(charactersData.data);
        setReviews(reviewsData.data);
        setRecommendations(recommendationsData.data);
      } catch (err) {
        if (!isSubscribed) return;
        setError('Failed to fetch anime data');
        console.error('Error fetching anime data:', err);
      } finally {
        if (!isSubscribed) return;
        setIsLoading(false);
      }
    };

    fetchAnimeData();

    return () => {
      isSubscribed = false;
    };
  }, [id]); // Only re-run when id changes

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
          <div className="text-red-600 text-center py-8">
            {error || 'Failed to load anime details'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3">
              <img
                src={anime.images.jpg.large_image_url}
                alt={anime.title}
                className="w-full h-auto"
              />
            </div>

            <div className="p-6 md:w-2/3">
              <h1 className="text-3xl font-bold mb-4">{anime.title}</h1>

              <div className="flex items-center mb-4">
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <span className="font-semibold">{anime.score || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <p>{anime.status}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Episodes</h3>
                  <p>{anime.episodes || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Duration</h3>
                  <p>{anime.duration}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Rating</h3>
                  <p>{anime.rating}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre.mal_id}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Synopsis</h3>
                <p className="text-gray-600 whitespace-pre-line">{anime.synopsis}</p>
              </div>

              {anime.trailer && anime.trailer.embed_url && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Trailer</h3>
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Trailer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Reviews</h2>
              
              {/* Reviews Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentReviewPage(prev => Math.max(1, prev - 1))}
                    disabled={currentReviewPage === 1}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm">
                    Page {currentReviewPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentReviewPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentReviewPage === totalPages}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentReviews.map((review) => (
                <div key={review.mal_id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
                  <div className="flex items-center mb-4">
                    <img
                      src={review.user.images.jpg.image_url}
                      alt={review.user.username}
                      className="w-10 h-10 rounded-full mr-4"
                    />
                    <div>
                      <h3 className="font-medium">{review.user.username}</h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span>{review.score}/10</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">{review.review}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{review.reactions.nice}</span>
                      </div>
                      <span>{new Date(review.date).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Characters Section */}
        {characters.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Characters</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {characters.slice(0, 12).map((char) => (
                <LazyLoad key={char.character.mal_id} delay={100}>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <img
                      src={char.character.images.jpg.image_url}
                      alt={char.character.name}
                      className="w-full h-48 object-cover rounded-md mb-2"
                    />
                    <h3 className="font-medium text-sm text-center">{char.character.name}</h3>
                    <p className="text-xs text-gray-500 text-center">{char.role}</p>
                  </div>
                </LazyLoad>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.slice(0, 6).map((rec: any) => (
                <LazyLoad key={rec.entry.mal_id} delay={200}>
                  <AnimeCard anime={rec.entry} />
                </LazyLoad>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Review"
      >
        {selectedReview && (
          <div>
            <div className="flex items-center mb-4">
              <img
                src={selectedReview.user.images.jpg.image_url}
                alt={selectedReview.user.username}
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <h3 className="font-medium text-lg">{selectedReview.user.username}</h3>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-1" />
                  <span className="text-lg">{selectedReview.score}/10</span>
                </div>
              </div>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line">{selectedReview.review}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span>{selectedReview.reactions.nice}</span>
                </div>
                <span>{new Date(selectedReview.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Trailer Modal */}
      <Modal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        title="Trailer"
      >
        {showTrailer && anime?.trailer?.embed_url && (
          <div className="relative w-full" style={{ height: '70vh' }}>
            <iframe
              src={anime.trailer.embed_url}
              frameBorder="0"
              className="absolute top-0 left-0 w-full h-full"
            ></iframe>
          </div>
        )}
      </Modal>
    </div>
  );
}
