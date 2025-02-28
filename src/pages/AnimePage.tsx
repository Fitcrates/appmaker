import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Play, Search, Bookmark } from 'lucide-react';
import { Anime } from '../types';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { Modal } from '../components/Modal';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { StarRating } from '../components/StarRating';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { supabase, queries } from '../lib/supabase';
import { AnimeCharacters } from '../components/anime/AnimeCharacters';
import { AnimeReviews } from '../components/anime/AnimeReviews';
import { AnimeRecommendations } from '../components/anime/AnimeRecommendations';
import { getNavigationState, clearNavigationState } from '../utils/navigationState';
import { Episodes } from '../components/anime/Episodes';
import { AnimeTrailer } from '../components/anime/AnimeTrailer';
import { useWatchlist } from '../hooks/useWatchlist';
import { Tooltip } from '../components/ui/Tooltip';

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

export function AnimePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<AnimeRecommendation[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
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
  const mounted = useRef(false);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  const [hasLoadedRecommendations, setHasLoadedRecommendations] = useState(false);
  const [hasLoadedEpisodes, setHasLoadedEpisodes] = useState(false);

  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  const reviewsRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);
  const episodesRef = useRef<HTMLDivElement>(null);

  const loadReviews = useCallback(async () => {
    if (!id || hasLoadedReviews || isLoadingReviews) return;

    setIsLoadingReviews(true);
    console.log('Loading reviews for anime:', id);

    try {
      const response = await fetchFromAPI(`/anime/${id}/reviews`, RequestPriority.Low);
      console.log('Reviews API response:', response);
      if (response?.data) {
        const validReviews = response.data.filter((review: any) => review.review && review.user);
        console.log('Valid reviews count:', validReviews.length);
        setReviews(validReviews);
      }
      setHasLoadedReviews(true);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [id, hasLoadedReviews, isLoadingReviews]);

  const loadRecommendations = useCallback(async () => {
    if (!id || hasLoadedRecommendations || isLoadingRecommendations) return;

    setIsLoadingRecommendations(true);
    console.log('Loading recommendations for anime:', id);

    try {
      const response = await fetchFromAPI(`/anime/${id}/recommendations`, RequestPriority.Low);
      console.log('Recommendations API response:', response);
      if (response?.data) {
        console.log('Valid recommendations count:', response.data.length);
        setRecommendations(response.data);
      }
      setHasLoadedRecommendations(true);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [id, hasLoadedRecommendations, isLoadingRecommendations]);

  const loadEpisodes = useCallback(async () => {
    if (!id || hasLoadedEpisodes || isLoadingEpisodes) return;

    setIsLoadingEpisodes(true);
    console.log('Loading episodes for anime:', id);

    try {
      const response = await fetchFromAPI(`/anime/${id}/episodes?page=1`, RequestPriority.Low);
      console.log('Episodes API response:', response);
      if (response?.data) {
        setEpisodes(response.data);
      }
      setHasLoadedEpisodes(true);
    } catch (error) {
      console.error('Error loading episodes:', error);
    } finally {
      setIsLoadingEpisodes(false);
    }
  }, [id, hasLoadedEpisodes, isLoadingEpisodes]);

  const isElementInViewport = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, []);

  const [isReviewsVisible, setIsReviewsVisible] = useState(false);
  const [isRecommendationsVisible, setIsRecommendationsVisible] = useState(false);
  const [isEpisodesVisible, setIsEpisodesVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!reviewsRef.current || !recommendationsRef.current || !episodesRef.current) return;

      const reviewsVisible = isElementInViewport(reviewsRef.current);
      const recommendationsVisible = isElementInViewport(recommendationsRef.current);
      const episodesVisible = isElementInViewport(episodesRef.current);

      setIsReviewsVisible(reviewsVisible);
      setIsRecommendationsVisible(recommendationsVisible);
      setIsEpisodesVisible(episodesVisible);

      console.log('Visibility states:', {
        reviews: reviewsVisible,
        recommendations: recommendationsVisible,
        episodes: episodesVisible
      });
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isElementInViewport]);

  useEffect(() => {
    const loadDynamicContent = async () => {
      if (isReviewsVisible && !hasLoadedReviews && !isLoadingReviews) {
        await loadReviews();
      }

      if (isRecommendationsVisible && !hasLoadedRecommendations && !isLoadingRecommendations) {
        await loadRecommendations();
      }

      if (isEpisodesVisible && !hasLoadedEpisodes && !isLoadingEpisodes) {
        await loadEpisodes();
      }
    };

    loadDynamicContent();
  }, [
    isReviewsVisible,
    isRecommendationsVisible,
    isEpisodesVisible,
    hasLoadedReviews,
    hasLoadedRecommendations,
    hasLoadedEpisodes,
    isLoadingReviews,
    isLoadingRecommendations,
    isLoadingEpisodes,
    loadReviews,
    loadRecommendations,
    loadEpisodes
  ]);

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
            title_japanese: data.data.title_japanese,
            episodes: data.data.episodes,
            members: data.data.members,
            favorites: data.data.favorites,
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
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setReviews([]);
    setRecommendations([]);
    setEpisodes([]);
    setHasLoadedReviews(false);
    setHasLoadedRecommendations(false);
    setHasLoadedEpisodes(false);
    setIsLoadingReviews(false);
    setIsLoadingRecommendations(false);
    setIsLoadingEpisodes(false);
    setCurrentReviewPage(1);
    window.scrollTo(0, 0);
  }, [id]);

  const fetchUserRating = async () => {
    if (!user?.id || !anime?.mal_id) return;
    
    try {
      const { data: rating } = await queries.getUserRating(user.id, anime.mal_id);
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
          anime_title: anime.title,
          anime_image: anime.images?.jpg?.image_url,
          genres: anime.genres,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,anime_id'
        });

      if (error) throw error;

      setUserRating(rating);
      setRatingMessage('Rating saved successfully!');

      // Clear message after 3 seconds
      setTimeout(() => {
        if (mounted.current) {
          setRatingMessage('');
        }
      }, 3000);

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
        if (!reviewsRef.current || !recommendationsRef.current || !episodesRef.current) return;
        
        if (!hasLoadedReviews && isElementInViewport(reviewsRef.current)) loadReviews();
        if (!hasLoadedRecommendations && isElementInViewport(recommendationsRef.current)) loadRecommendations();
        if (!hasLoadedEpisodes && isElementInViewport(episodesRef.current)) loadEpisodes();
      }, 100);
    };
  }, [loadReviews, loadRecommendations, loadEpisodes, hasLoadedReviews, hasLoadedRecommendations, hasLoadedEpisodes]);

  useEffect(() => {
    window.addEventListener('scroll', debouncedScroll, { passive: true });
    return () => window.removeEventListener('scroll', debouncedScroll);
  }, [debouncedScroll]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSearch = () => {
    navigate('/', {
      state: { openSearchModal: true }
    });
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleReviewClick = (review: Review) => {
    console.log("Review clicked:", review);
    setSelectedReview(review);
  };

  return (
    <ErrorBoundary>
      <div className="mx-auto min-h-screen max-w-[100rem] space-y-6 px-4 sm:px-6 lg:px-8 mt-12">
        {anime ? (
          <div>
            <div className="container mx-auto px-4 py-8 mt-12 ">
              {/* Main Content */}
              <div className="flex flex-col gap-8 ">
                {/* Header Section */}
                <div className="rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
                  <button
                    onClick={handleBack}
                    className="flex items-center bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon2"
                  >
                    <ArrowLeft className="bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon2"/>
                    Back
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 ">
                  <div className="w-3/4 md:w-1/3 lg:w-1/4 shrink-0 justify-center items-center ">
                    <img
                      src={anime.images.jpg.large_image_url}
                      alt={anime.title}
                      className="w-full rounded-lg shadow-lg text-white"
                    />
                    <div className="mt-4 space-y-2">
                      {anime.score && (
                        <div className="flex items-center justify-between">
                          <span className="text-white">Score</span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-white">{anime.score}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-white">Status</span>
                        <span className="text-white">{anime.status}</span>
                      </div>
                      {anime.year && (
                        <div className="flex items-center justify-between">
                          <span className="text-white">Year</span>
                          <span className="text-white">{anime.year}</span>
                        </div>
                      )}
                    </div>
                    {user && (
                      <div className="mt-4 w-full">
                        <h3 className="font-medium mb-2 text-white">Your Rating</h3>
                        <StarRating
      initialRating={userRating || 0}
      onRatingChange={handleRatingChange}
      disabled={false} // Set to true if you want to disable user interaction
    />
    <div className="flex mt-4 w-full justify-center items-center">
                        <Tooltip content={isInWatchlist[anime.mal_id] ? "Remove from Watchlist" : "Add to Watchlist"}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInWatchlist[anime.mal_id]) {
                                removeFromWatchlist(anime.mal_id);
                              } else {
                                addToWatchlist({
                                  mal_id: anime.mal_id,
                                  title: anime.title,
                                  images: {
                                    jpg: {
                                      image_url: anime.images.jpg.image_url
                                    }
                                  }
                                });
                              }
                            }}
                            className="flex flex-col items-center gap-1 p-2 bg-black rounded-full shadow-md mt-4 "
                          >
                            <Bookmark
                              className={`w-4 h-4 ${
                                isInWatchlist[anime.mal_id] ? "text-yellow-500 fill-current " : "text-white"
                              }`}
                            />
                          </button>
                        </Tooltip>
                        {ratingMessage && (
                          <p className="text-sm text-center text-green-500 mt-1">{ratingMessage}</p>
                        )}
                      </div>
                      </div>
                    )}
                    
                  </div>
                
                  <div className="md:w-2/3 lg:w-3/4 flex-grow">
                  <h1 className="text-3xl font-bold text-white">{anime.title}</h1>
                    <h2 className="text-xl text-white mb-4">{anime.title_japanese}</h2>
                    
                    {anime.genres && (
                      <div className="mb-4 text-white">
                        <h3 className="font-medium mb-2 text-white">Genres</h3>
                        <p>{anime.genres.map((genre) => genre.name).join(', ')}</p>
                      </div>
                    )}
                   
                    <p className="text-white mb-4">{anime.synopsis}</p>

                    {anime.trailer?.youtube_id && (
                      <div className="mb-6">
                        <AnimeTrailer
                          youtubeId={anime.trailer.youtube_id}
                          embedUrl={anime.trailer.embed_url}
                          onTrailerClick={() => setShowTrailer(true)}
                        />
                      </div>
                    )}

                    <div className="flex w-full gap-8 justify-between mt-12 ">
                      <div className="w-1/2">
                        <h3 className="bg-clip-text text-[#EC4899] drop-shadow-[0_0_8px_#fa448c] tilt-neon4 mb-4">Information</h3>
                        <dl className="space-y-2 justify-between w-full ">
                          <div className="flex justify-between border-t ">
                            <dt className="text-white ">Type</dt>
                            <dd className="text-white">{anime.type}</dd>
                          </div>
                          <div className="flex justify-between border-t">
                            <dt className="text-white">Episodes</dt>
                            <dd className="text-white">{anime.episodes}</dd>
                          </div>
                          <div className="flex justify-between border-t">
                            <dt className="text-white">Status</dt>
                            <dd className="text-white">{anime.status}</dd>
                          </div>
                          <div className="flex justify-between border-t">
                            <dt className="text-white">Duration</dt>
                            <dd className="text-white">{anime.duration}</dd>
                          </div>
                          <div className="flex justify-between border-t">
                            <dt className="text-white">Aired</dt>
                            <dd className="text-white">
                              {anime.aired
                                ? `${new Date(anime.aired.from).toLocaleDateString()} - ${anime.aired.to ? new Date(anime.aired.to).toLocaleDateString() : 'Present'}`
                                : 'N/A'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div className="w-1/2">
                        <h3 className="bg-clip-text text-[#56d8ff] drop-shadow-[0_0_8px_#56d8ff] tilt-neon4 mb-4">Statistics</h3>
                        <dl className="space-y-2 justify-between w-full">
                          {anime.members && (
                            <div className="flex justify-between border-t">
                              <dt className="text-white">Members</dt>
                              <dd className="text-white">{anime.members.toLocaleString()}</dd>
                            </div>
                          )}
                          {anime.favorites && (
                            <div className="flex justify-between border-t">
                              <dt className="text-white">Favorites</dt>
                              <dd className="text-white">{anime.favorites.toLocaleString()}</dd>
                            </div>
                          )}
                          {anime.rank && (
                            <div className="flex justify-between border-t">
                              <dt className="text-white">Rank</dt>
                              <dd className="text-white">#{anime.rank.toLocaleString()}</dd>
                            </div>
                          )}
                          {anime.popularity && (
                            <div className="flex justify-between border-t">
                              <dt className="text-white">Popularity</dt>
                              <dd className="text-white">#{anime.popularity.toLocaleString()}</dd>
                            </div>
                          )}
                          {anime.scored_by && (
                            <div className="flex justify-between border-t">
                              <dt className="text-white">Scored By</dt>
                              <dd className="text-white">#{anime.scored_by.toLocaleString()}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Characters Section */}
                <div className="relative mt-8">
                  <AnimeCharacters animeId={Number(id)} />
                </div>

                {/* Reviews Section */}
                <div className="relative mt-8" ref={reviewsRef}>
                  <AnimeReviews
                    reviews={reviews}
                    currentReviewPage={currentReviewPage}
                    totalPages={totalPages}
                    reviewsPerPage={reviewsPerPage}
                    isLoading={isLoadingReviews}
                    hasLoaded={hasLoadedReviews}
                    onPageChange={setCurrentReviewPage}
                    onReviewClick={handleReviewClick}
                  />
                </div>

                {/* Episodes Section */}
                <div className="mt-8" ref={episodesRef}>
                  {episodes.length > 0 ? (
                    <div>
                      <h2 className="bg-clip-text text-[#EC4899] drop-shadow-[0_0_8px_#fa448c] tilt-neon mb-4">Episodes</h2>
                      <Episodes animeId={Number(id)} episodes={episodes} />
                    </div>
                  ) : isLoadingEpisodes ? (
                    <div className="animate-pulse">Loading episodes...</div>
                  ) : null}
                </div>

                {/* Recommendations Section */}
                <div className="mt-4" ref={recommendationsRef}>
                  <AnimeRecommendations
                    recommendations={recommendations}
                    isLoading={isLoadingRecommendations}
                    hasLoaded={hasLoadedRecommendations}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Review Modal */}
        {selectedReview && (
          <Modal 
            isOpen={!!selectedReview}
            onClose={() => setSelectedReview(null)}
            title={`Review by ${selectedReview.user.username}`}
          >
            <div className="p-6 max-w-2xl w-full ">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedReview.user.images.jpg.image_url}
                  alt={selectedReview.user.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-white">{selectedReview.user.username}</p>
                  <p className="text-sm text-white">{selectedReview.date}</p>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-white">{selectedReview.review}</p>
            </div>
          </Modal>
        )}

        {/* Trailer Modal */}
        {showTrailer && anime?.trailer?.youtube_id && (
          <Modal
            isOpen={showTrailer}
            onClose={() => setShowTrailer(false)}
            title={`${anime?.title || 'Anime'} - Trailer`}
          >
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${anime.trailer.youtube_id}?autoplay=1`}
                title={`${anime.title || 'Anime'} trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          </Modal>
        )}
      </div>
    </ErrorBoundary>
  );
}
