import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ThumbsUp, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Anime } from '../types';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Modal } from '../components/Modal';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

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

  const [hasLoadedCharacters, setHasLoadedCharacters] = useState(false);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  const [hasLoadedRecommendations, setHasLoadedRecommendations] = useState(false);

  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const charactersRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  const { isIntersecting: isCharactersVisible } = useIntersectionObserver(charactersRef);
  const { isIntersecting: isReviewsVisible } = useIntersectionObserver(reviewsRef);
  const { isIntersecting: isRecommendationsVisible } = useIntersectionObserver(recommendationsRef);

  useEffect(() => {
    console.log('Visibility states:', {
      characters: isCharactersVisible,
      reviews: isReviewsVisible,
      recommendations: isRecommendationsVisible
    });
  }, [isCharactersVisible, isReviewsVisible, isRecommendationsVisible]);

  // Check if an element is in viewport
  const isElementInViewport = (element: HTMLElement | null) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= -rect.height &&
      rect.left >= -rect.width &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + rect.height &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) + rect.width
    );
  };

  // Load data functions with debounce
  const loadCharacters = useCallback(async () => {
    if (!id || hasLoadedCharacters || isLoadingCharacters) return;
    
    setIsLoadingCharacters(true);
    try {
      const data = await fetchFromAPI<any>(`/anime/${id}/characters`, {}, RequestPriority.MEDIUM);
      if (data?.data) {
        setCharacters(data.data);
        setHasLoadedCharacters(true);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setIsLoadingCharacters(false);
    }
  }, [id, hasLoadedCharacters, isLoadingCharacters]);

  const loadReviews = useCallback(async () => {
    if (!id || hasLoadedReviews || isLoadingReviews) return;
    
    setIsLoadingReviews(true);
    try {
      const data = await fetchFromAPI<any>(`/anime/${id}/reviews`, {}, RequestPriority.LOW);
      if (data?.data) {
        setReviews(data.data);
        setHasLoadedReviews(true);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [id, hasLoadedReviews, isLoadingReviews]);

  const loadRecommendations = useCallback(async () => {
    if (!id || hasLoadedRecommendations || isLoadingRecommendations) return;
    
    setIsLoadingRecommendations(true);
    try {
      const data = await fetchFromAPI<any>(`/anime/${id}/recommendations`, {}, RequestPriority.LOW);
      if (data?.data) {
        setRecommendations(data.data);
        setHasLoadedRecommendations(true);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [id, hasLoadedRecommendations, isLoadingRecommendations]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Reset state when ID changes
  useEffect(() => {
    setCharacters([]);
    setReviews([]);
    setRecommendations([]);
    setHasLoadedCharacters(false);
    setHasLoadedReviews(false);
    setHasLoadedRecommendations(false);
    setIsLoadingCharacters(false);
    setIsLoadingReviews(false);
    setIsLoadingRecommendations(false);
    window.scrollTo(0, 0);
  }, [id]);

  // Load initial anime data
  useEffect(() => {
    let isSubscribed = true;

    const fetchAnimeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await fetchFromAPI<any>(`/anime/${id}/full`);
        if (!isSubscribed) return;
        
        setAnime(data?.data);
        
        // Preload related anime
        if (data?.data?.genres?.length > 0) {
          const genreIds = data.data.genres.slice(0, 2).map((g: any) => g.mal_id).join(',');
          fetchFromAPI(`/anime`, { genres: genreIds, limit: 5 }, RequestPriority.LOW);
        }
      } catch (error) {
        console.error('Error fetching anime:', error);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
          // Check visibility after a short delay to ensure DOM is ready
          setTimeout(() => {
            if (!isSubscribed) return;
            if (isElementInViewport(charactersRef.current)) loadCharacters();
            if (isElementInViewport(reviewsRef.current)) loadReviews();
            if (isElementInViewport(recommendationsRef.current)) loadRecommendations();
          }, 100);
        }
      }
    };

    fetchAnimeData();
    return () => { isSubscribed = false; };
  }, [id]);

  // Debounced scroll handler
  const debouncedScroll = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!charactersRef.current || !reviewsRef.current || !recommendationsRef.current) return;
        
        if (!hasLoadedCharacters && isElementInViewport(charactersRef.current)) loadCharacters();
        if (!hasLoadedReviews && isElementInViewport(reviewsRef.current)) loadReviews();
        if (!hasLoadedRecommendations && isElementInViewport(recommendationsRef.current)) loadRecommendations();
      }, 100);
    };
  }, [loadCharacters, loadReviews, loadRecommendations, hasLoadedCharacters, hasLoadedReviews, hasLoadedRecommendations]);

  // Load additional data on scroll
  useEffect(() => {
    window.addEventListener('scroll', debouncedScroll, { passive: true });
    return () => window.removeEventListener('scroll', debouncedScroll);
  }, [debouncedScroll]);

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
      <div className="container mx-auto px-4 py-8">
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

        {/* Characters Section */}
        <div 
          ref={charactersRef} 
          className="section-characters mt-8"
          style={{ minHeight: '100px' }}
        >
          <h2 className="text-2xl font-bold mb-4">Characters</h2>
          {!hasLoadedCharacters ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-40 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : isLoadingCharacters ? (
            <p>Loading...</p>
          ) : characters.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {characters.slice(0, 12).map((char) => (
                <LazyLoad key={char.character.mal_id} delay={100}>
                  <div className="text-center">
                    <img
                      src={char.character.images.jpg.image_url}
                      alt={char.character.name}
                      className="w-full h-40 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm font-medium">{char.character.name}</p>
                  </div>
                </LazyLoad>
              ))}
            </div>
          ) : (
            <p>No characters found.</p>
          )}
        </div>

        {/* Reviews Section */}
        <div 
          ref={reviewsRef} 
          className="section-reviews mt-8"
          style={{ minHeight: '100px' }}
        >
          <h2 className="text-2xl font-bold mb-4">Reviews</h2>
          {!hasLoadedReviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : isLoadingReviews ? (
            <p>Loading...</p>
          ) : reviews.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1"></div>
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
                          <Star className="h-4 w-4 text-black mr-1" />
                          <span>{review.score}/10</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">{review.review}</p>
                    <div className="flex items-center justify-between text-sm text-black p-8">
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
            </>
          ) : (
            <p>No reviews found.</p>
          )}
        </div>

        {/* Recommendations Section */}
        <div 
          ref={recommendationsRef} 
          className="section-recommendations mt-8"
          style={{ minHeight: '100px' }}
        >
          <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
          {!hasLoadedRecommendations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-48 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : isLoadingRecommendations ? (
            <p>Loading...</p>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.slice(0, 6).map((rec: any) => (
                <LazyLoad key={rec.entry.mal_id} delay={200}>
                  <AnimeCard anime={rec.entry} />
                </LazyLoad>
              ))}
            </div>
          ) : (
            <p>No recommendations found.</p>
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
                    <Star className="h-5 w-5 text-black mr-1" />
                    <span className="text-lg">{selectedReview.score}/10</span>
                  </div>
                </div>
              </div>
              <div className="prose max-w-none p-8">
                <p className="whitespace-pre-line">{selectedReview.review}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-black p-8">
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
    </div>
  );
}
