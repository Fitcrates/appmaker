import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Play } from 'lucide-react';
import { Anime } from '../types';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { Modal } from '../components/Modal';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { StarRating } from '../components/StarRating';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { supabase, queries } from '../lib/supabase';
import { AnimeCharacters } from '../components/anime/AnimeCharacters';
import { AnimeReviews } from '../components/anime/AnimeReviews';
import { AnimeRecommendations } from '../components/anime/AnimeRecommendations';
import { AnimeTrailer } from '../components/anime/AnimeTrailer';

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

function AnimePage() {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [recommendations, setRecommendations] = useState<AnimeRecommendation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

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

  const loadCharacters = useCallback(async () => {
    if (!id || hasLoadedCharacters || isLoadingCharacters) return;
    
    setIsLoadingCharacters(true);
    try {
      console.log('Loading characters for anime:', id);
      const data = await fetchFromAPI<any>(`/anime/${id}/characters`);
      console.log('Characters API response:', data);
      
      if (data?.data) {
        const validCharacters = data.data
          .filter((char: any) => {
            try {
              return char?.character?.mal_id && char?.character?.name;
            } catch (e) {
              console.error('Error validating character:', e);
              return false;
            }
          })
          .map((char: any) => ({
            character: {
              mal_id: char.character.mal_id,
              name: char.character.name,
              images: {
                jpg: {
                  image_url: char?.character?.images?.jpg?.image_url || '/placeholder-avatar.png'
                }
              }
            },
            role: char?.role || 'Unknown Role'
          }));
        
        console.log('Valid characters count:', validCharacters.length);
        if (validCharacters.length > 0) {
          setCharacters(validCharacters);
          setHasLoadedCharacters(true);
        }
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
      console.log('Loading reviews for anime:', id);
      const data = await fetchFromAPI<any>(`/anime/${id}/reviews`);
      console.log('Reviews API response:', data);
      
      if (data?.data) {
        const validReviews = data.data.filter((review: any) => {
          try {
            return (
              review?.mal_id &&
              typeof review?.review === 'string' &&
              review?.user?.username
              // Removed date check since we'll handle it in the mapping
            );
          } catch (e) {
            console.error('Error validating review:', e);
            return false;
          }
        }).map((review: any) => {
          // Handle date separately to avoid any undefined issues
          let formattedDate = 'Date not available';
          try {
            if (review.date) {
              const date = new Date(review.date);
              if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString();
              }
            }
          } catch (e) {
            console.error('Error formatting date:', e);
          }

          return {
            ...review,
            date: formattedDate,
            user: {
              ...review.user,
              images: {
                jpg: {
                  image_url: review?.user?.images?.jpg?.image_url || '/placeholder-avatar.png'
                }
              }
            }
          };
        });
        
        console.log('Valid reviews count:', validReviews.length);
        setReviews(validReviews);
      } else {
        console.log('No reviews data found');
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
      setHasLoadedReviews(true);
    }
  }, [id, hasLoadedReviews, isLoadingReviews]);

  const loadRecommendations = useCallback(async () => {
    if (!id || hasLoadedRecommendations || isLoadingRecommendations) return;
    
    setIsLoadingRecommendations(true);
    try {
      console.log('Loading recommendations for anime:', id);
      const data = await fetchFromAPI<any>(`/anime/${id}/recommendations`);
      console.log('Recommendations API response:', data);
      
      if (data?.data) {
        const validRecommendations = data.data.filter((rec: any) => {
          try {
            return (
              rec?.entry?.mal_id &&
              rec?.entry?.title &&
              // Check if image exists but don't require it
              (rec?.entry?.images?.jpg?.image_url || true)
            );
          } catch (e) {
            console.error('Error validating recommendation:', e);
            return false;
          }
        }).map((rec: any) => ({
          ...rec,
          entry: {
            ...rec.entry,
            images: {
              jpg: {
                // Use a fallback image if none exists
                image_url: rec?.entry?.images?.jpg?.image_url || '/placeholder.jpg'
              }
            }
          }
        }));
        
        console.log('Valid recommendations count:', validRecommendations.length);
        setRecommendations(validRecommendations);
      } else {
        console.log('No recommendations data found');
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
      setHasLoadedRecommendations(true);
    }
  }, [id, hasLoadedRecommendations, isLoadingRecommendations]);

  useEffect(() => {
    const loadAnimeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching anime data for ID:', id);
        const data = await fetchFromAPI<any>(`/anime/${id}`, RequestPriority.High);
        console.log('Received anime data:', data);
        
        if (data?.data) {
          const processedData = {
            mal_id: data.data.mal_id,
            title: data.data.title,
            images: data.data.images,
            synopsis: data.data.synopsis,
            score: data.data.score,
            scored_by: data.data.scored_by,
            rank: data.data.rank,
            popularity: data.data.popularity,
            status: data.data.status,
            aired: data.data.aired,
            duration: data.data.duration,
            rating: data.data.rating,
            genres: data.data.genres || [],
            trailer: data.data.trailer,
            studios: data.data.studios || []
          };
          
          console.log('Processed anime data:', processedData);
          setAnime(processedData);
        }
      } catch (error) {
        console.error('Error fetching anime data:', error);
        setError('Failed to load anime data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnimeData();
  }, [id]);

  useEffect(() => {
    const loadDynamicContent = async () => {
      if (!id || !anime) return;

      if (isCharactersVisible && !hasLoadedCharacters && !isLoadingCharacters) {
        await loadCharacters();
      }

      if (isReviewsVisible && !hasLoadedReviews && !isLoadingReviews) {
        await loadReviews();
      }

      if (isRecommendationsVisible && !hasLoadedRecommendations && !isLoadingRecommendations) {
        await loadRecommendations();
      }
    };

    loadDynamicContent();
  }, [
    id,
    anime,
    isCharactersVisible,
    isReviewsVisible,
    isRecommendationsVisible,
    hasLoadedCharacters,
    hasLoadedReviews,
    hasLoadedRecommendations,
    isLoadingCharacters,
    isLoadingReviews,
    isLoadingRecommendations,
    loadCharacters,
    loadReviews,
    loadRecommendations
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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
    setCurrentReviewPage(1);
    window.scrollTo(0, 0);
  }, [id]);

  const fetchUserRating = async () => {
    if (!user?.id || !anime?.mal_id) return;
    
    try {
      const rating = await queries.getUserRating(user.id, anime.mal_id);
      setUserRating(rating || 0);
    } catch (error) {
      console.error('Error fetching user rating:', error);
      setUserRating(0);
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (!user?.id || !anime?.mal_id) {
      setRatingMessage('Please log in to rate anime');
      return;
    }

    try {
      setIsRating(true);
      setRatingMessage('');

      const { error } = await supabase
        .from('user_feedback')
        .upsert({
          user_id: user.id,
          anime_id: anime.mal_id,
          rating: rating,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,anime_id'
        });

      if (error) throw error;

      setUserRating(rating);
      setRatingMessage('Rating saved!');
      setTimeout(() => setRatingMessage(''), 2000);
    } catch (error) {
      console.error('Error saving rating:', error);
      setRatingMessage('Failed to save rating');
    } finally {
      setIsRating(false);
    }
  };

  useEffect(() => {
    if (user && anime?.mal_id) {
      fetchUserRating();
    } else {
      setUserRating(0);
      setRatingMessage('');
    }
  }, [user, anime?.mal_id]);

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

  useEffect(() => {
    window.addEventListener('scroll', debouncedScroll, { passive: true });
    return () => window.removeEventListener('scroll', debouncedScroll);
  }, [debouncedScroll]);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Link>

        {error ? (
          <div className="text-red-500">{error}</div>
        ) : isLoading ? (
          <div className="animate-pulse">Loading...</div>
        ) : anime ? (
          <div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 lg:w-1/4">
                <img
                  src={anime.images.jpg.large_image_url}
                  alt={anime.title}
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="mt-4 space-y-2">
                  {anime.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Score</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span>{anime.score}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span>{anime.status}</span>
                  </div>
                  {anime.year && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Year</span>
                      <span>{anime.year}</span>
                    </div>
                  )}
                </div>
                {user && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Your Rating</h3>
                    <StarRating
                      initialRating={userRating}
                      onRatingChange={handleRatingChange}
                      disabled={isRating}
                    />
                    {ratingMessage && (
                      <p className="text-sm text-green-500 mt-1">{ratingMessage}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="md:w-2/3 lg:w-3/4">
                <h1 className="text-3xl font-bold mb-2">{anime.title}</h1>
                <h2 className="text-xl text-gray-600 mb-4">{anime.title_japanese}</h2>
                
                <p className="text-gray-700 mb-4">{anime.synopsis}</p>

                {anime.trailer?.youtube_id && (
                  <div className="mb-6">
                    <AnimeTrailer
                      youtubeId={anime.trailer.youtube_id}
                      embedUrl={anime.trailer.embed_url}
                      onTrailerClick={() => setShowTrailer(true)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Information</h3>
                    <dl className="space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Type</dt>
                        <dd>{anime.type}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Episodes</dt>
                        <dd>{anime.episodes}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Status</dt>
                        <dd>{anime.status}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Statistics</h3>
                    <dl className="space-y-1">
                      {anime.members && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Members</dt>
                          <dd>{anime.members.toLocaleString()}</dd>
                        </div>
                      )}
                      {anime.favorites && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Favorites</dt>
                          <dd>{anime.favorites.toLocaleString()}</dd>
                        </div>
                      )}
                      {anime.rank && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Rank</dt>
                          <dd>#{anime.rank.toLocaleString()}</dd>
                        </div>
                      )}
                      {anime.popularity && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Popularity</dt>
                          <dd>#{anime.popularity.toLocaleString()}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Characters Section */}
            <div ref={charactersRef}>
              <AnimeCharacters
                characters={characters}
                isLoading={isLoadingCharacters}
                hasLoaded={hasLoadedCharacters}
              />
            </div>

            {/* Reviews Section */}
            <div ref={reviewsRef}>
              <AnimeReviews
                reviews={reviews}
                currentReviewPage={currentReviewPage}
                totalPages={totalPages}
                reviewsPerPage={reviewsPerPage}
                isLoading={isLoadingReviews}
                hasLoaded={hasLoadedReviews}
                onPageChange={setCurrentReviewPage}
                onReviewClick={setSelectedReview}
              />
            </div>

            {/* Recommendations Section */}
            <div ref={recommendationsRef}>
              <AnimeRecommendations
                recommendations={recommendations}
                isLoading={isLoadingRecommendations}
                hasLoaded={hasLoadedRecommendations}
              />
            </div>
          </div>
        ) : null}

        {selectedReview && (
          <Modal onClose={() => setSelectedReview(null)}>
            <div className="p-6 max-w-2xl w-full">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedReview.user.images.jpg.image_url}
                  alt={selectedReview.user.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{selectedReview.user.username}</p>
                  <p className="text-sm text-gray-600">{selectedReview.date}</p>
                </div>
              </div>
              <p className="whitespace-pre-wrap">{selectedReview.review}</p>
            </div>
          </Modal>
        )}

        {anime && showTrailer && (
          <Modal
            isOpen={showTrailer}
            onClose={() => setShowTrailer(false)}
            title={`${anime?.title || 'Anime'} - Trailer`}
          >
            <div className="relative w-full h-full">
              {showTrailer && anime?.trailer?.embed_url && (
                <iframe
                  ref={iframeRef}
                  src={anime.trailer.embed_url}
                  title={`${anime.title || 'Anime'} trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

export default function AnimePageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AnimePage />
    </ErrorBoundary>
  );
}
