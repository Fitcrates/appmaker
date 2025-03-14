import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFromAPI, RequestPriority } from '../utils/api';
import { Anime } from '../types/anime';
import { AnimeCharacters } from '../components/anime/AnimeCharacters';
import { AnimeReviews } from '../components/anime/AnimeReviews';
import { AnimeRecommendations } from '../components/anime/AnimeRecommendations';
import { Episodes } from '../components/anime/Episodes';
import type { Review } from '../types/review';
import type { Episode } from '../types/episode';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Modal } from '../components/Modal';
import { StarRating } from '../components/StarRating';
import { Bookmark, Star } from 'lucide-react';
import { Tooltip } from '../components/Tooltip';
import Breadcrumbs from '../components/Breadcrumbs';
import { useWatchlist } from '../hooks/useWatchlist';
import { AnimeTrailer } from '../components/anime/AnimeTrailer';

interface AnimeRecommendation {
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

export function AnimePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<AnimeRecommendation[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(0);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const recommendationsPerPage = 10;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mounted = useRef(false);

  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  // Track loading states to prevent duplicate requests
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);
  const [hasLoadedRecommendations, setHasLoadedRecommendations] = useState(false);
  const [hasLoadedEpisodes, setHasLoadedEpisodes] = useState(false);

  // References to track in-progress requests
  const animeRequestRef = useRef(false);
  const reviewsRequestRef = useRef(false);
  const recommendationsRequestRef = useRef(false);
  const episodesRequestRef = useRef(false);

  // References for intersection observer
  const reviewsRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);
  const episodesRef = useRef<HTMLDivElement>(null);

  const loadReviews = useCallback(async () => {
    // Skip if already loaded, loading, or a request is in progress
    if (!id || hasLoadedReviews || reviewsRequestRef.current) return;

    reviewsRequestRef.current = true;
    setIsLoading(true);
    console.log('Loading reviews for anime:', id);

    try {
      const response = await fetchFromAPI<{data?: Review[]}>(
        `/anime/${id}/reviews`, 
        { 
          page: currentReviewPage,
          per_page: reviewsPerPage
        }, 
        RequestPriority.LOW
      );
      
      console.log('Reviews API response:', response);
      if (response && response.data) {
        const validReviews = response.data.filter((review: any) => review && review.review && review.user);
        console.log('Valid reviews count:', validReviews.length);
        setReviews(validReviews);
      } else {
        console.log('No valid reviews data found');
        setReviews([]);
      }
      setHasLoadedReviews(true);
    } catch (error) {
      if (mounted.current) {
        console.error('Error loading reviews:', error);
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
        reviewsRequestRef.current = false;
      }
    }
  }, [id, hasLoadedReviews, currentReviewPage, reviewsPerPage]);

  const loadRecommendations = useCallback(async () => {
    // Skip if already loaded, loading, or a request is in progress
    if (!id || hasLoadedRecommendations || recommendationsRequestRef.current) return;

    recommendationsRequestRef.current = true;
    setIsLoading(true);
    console.log('Loading recommendations for anime:', id);

    try {
      const response = await fetchFromAPI<{data?: AnimeRecommendation[]}>(
        `/anime/${id}/recommendations`, 
        {}, 
        RequestPriority.LOW
      );
      
      console.log('Recommendations API response:', response);
      
      // Safely extract and validate the data
      const recommendationsData = response && response.data ? [...response.data] : [];
      console.log('Valid recommendations count:', recommendationsData.length);
      
      // Update state with the validated data
      setRecommendations(recommendationsData);
      
      // Preload recommendation images when browser is idle
      if (recommendationsData.length > 0 && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          recommendationsData.forEach((rec) => {
            if (rec && rec.entry && rec.entry.images && rec.entry.images.jpg) {
              const img = new Image();
              img.src = rec.entry.images.jpg.image_url;
            }
          });
        });
      }
      
      setHasLoadedRecommendations(true);
    } catch (error) {
      if (mounted.current) {
        console.error('Error loading recommendations:', error);
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
        recommendationsRequestRef.current = false;
      }
    }
  }, [id, hasLoadedRecommendations]);

  const loadEpisodes = useCallback(async () => {
    // Skip if already loaded, loading, or a request is in progress
    if (!id || hasLoadedEpisodes || episodesRequestRef.current) return;

    episodesRequestRef.current = true;
    setIsLoading(true);
    console.log('Loading episodes for anime:', id);

    try {
      const response = await fetchFromAPI<{data?: Episode[]}>(
        `/anime/${id}/episodes`, 
        {}, 
        RequestPriority.LOW
      );
      
      console.log('Episodes API response:', response);
      if (response && response.data) {
        setEpisodes(response.data);
      } else {
        console.log('No valid episodes data found');
        setEpisodes([]);
      }
      setHasLoadedEpisodes(true);
    } catch (error) {
      if (mounted.current) {
        console.error('Error loading episodes:', error);
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
        episodesRequestRef.current = false;
      }
    }
  }, [id, hasLoadedEpisodes]);

  // Set up intersection observers for lazy loading sections
  useEffect(() => {
    if (!id || !mounted.current) return;
    
    console.log('Setting up intersection observers');
    
    const options = {
      root: null,
      rootMargin: '200px', // Load content when it's 200px from viewport
      threshold: 0.1
    };

    const reviewsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('Reviews section is visible, loading data...');
          loadReviews();
          reviewsObserver.unobserve(entry.target);
        }
      });
    }, options);

    const recommendationsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('Recommendations section is visible, loading data...');
          loadRecommendations();
          recommendationsObserver.unobserve(entry.target);
        }
      });
    }, options);

    const episodesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('Episodes section is visible, loading data...');
          loadEpisodes();
          episodesObserver.unobserve(entry.target);
        }
      });
    }, options);

    // Ensure refs are available before observing
    setTimeout(() => {
      if (reviewsRef.current) {
        console.log('Observing reviews section');
        reviewsObserver.observe(reviewsRef.current);
      }

      if (recommendationsRef.current) {
        console.log('Observing recommendations section');
        recommendationsObserver.observe(recommendationsRef.current);
      }

      if (episodesRef.current) {
        console.log('Observing episodes section');
        episodesObserver.observe(episodesRef.current);
      }
    }, 500); // Small delay to ensure DOM is ready

    return () => {
      console.log('Cleaning up observers');
      if (reviewsRef.current) reviewsObserver.unobserve(reviewsRef.current);
      if (recommendationsRef.current) recommendationsObserver.unobserve(recommendationsRef.current);
      if (episodesRef.current) episodesObserver.unobserve(episodesRef.current);
    };
  }, [id, loadReviews, loadRecommendations, loadEpisodes]);

  // Fallback mechanism to ensure data is loaded
  useEffect(() => {
    if (!id || !mounted.current) return;
    
    // Set a timeout to load data if not already loaded
    const timeoutId = setTimeout(() => {
      if (!hasLoadedReviews && !reviewsRequestRef.current) {
        console.log('Fallback: Loading reviews data');
        loadReviews();
      }
      
      if (!hasLoadedRecommendations && !recommendationsRequestRef.current) {
        console.log('Fallback: Loading recommendations data');
        loadRecommendations();
      }
      
      if (!hasLoadedEpisodes && !episodesRequestRef.current) {
        console.log('Fallback: Loading episodes data');
        loadEpisodes();
      }
    }, 2000); // 2 seconds after component mounts
    
    return () => clearTimeout(timeoutId);
  }, [id, hasLoadedReviews, hasLoadedRecommendations, hasLoadedEpisodes, loadReviews, loadRecommendations, loadEpisodes]);

  // Load all data immediately after component mounts
  useEffect(() => {
    if (!id || !mounted.current) return;
    
    console.log('Initial data loading for anime ID:', id);
    
    // Small delay to ensure anime data is loaded first
    const timeoutId = setTimeout(() => {
      if (!hasLoadedReviews) {
        console.log('Initial loading of reviews');
        loadReviews();
      }
      
      if (!hasLoadedRecommendations) {
        console.log('Initial loading of recommendations');
        loadRecommendations();
      }
      
      if (!hasLoadedEpisodes) {
        console.log('Initial loading of episodes');
        loadEpisodes();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [id, hasLoadedReviews, hasLoadedRecommendations, hasLoadedEpisodes, loadReviews, loadRecommendations, loadEpisodes]);

  // Load anime details
  useEffect(() => {
    const fetchAnimeData = async () => {
      if (!id || animeRequestRef.current) return;
      
      animeRequestRef.current = true;
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching anime data for ID:', id);
        const data = await fetchFromAPI<{data?: Anime}>(`/anime/${id}`, undefined, RequestPriority.HIGH);
        console.log('Received anime data:', data);
        
        if (data && data.data) {
          setAnime(data.data);
          
          // Load additional data after anime data is loaded
          setTimeout(() => {
            loadReviews();
            loadRecommendations();
            loadEpisodes();
          }, 100);
        } else {
          console.log('No valid anime data found');
          setError('Failed to load anime data');
        }
      } catch (error) {
        console.error('Error fetching anime data:', error);
        setError('Failed to load anime data');
      } finally {
        setIsLoading(false);
        animeRequestRef.current = false;
      }
    };
    
    fetchAnimeData();
  }, [id, loadReviews, loadRecommendations, loadEpisodes]);

  // Set mounted ref
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Reset state when anime ID changes
  useEffect(() => {
    setReviews([]);
    setRecommendations([]);
    setEpisodes([]);
    setHasLoadedReviews(false);
    setHasLoadedRecommendations(false);
    setHasLoadedEpisodes(false);
    setCurrentReviewPage(1);
    setRecommendationsPage(1);
    window.scrollTo(0, 0);
  }, [id]);

  const handleReviewClick = (review: Review) => {
    setSelectedReview(review);
  };

  const handleCloseReviewModal = () => {
    setSelectedReview(null);
  };

  // Handle opening the trailer modal
  const handleTrailerClick = () => {
    setShowTrailer(true);
  };

  // Handle closing the trailer modal
  const handleCloseTrailerModal = () => {
    setShowTrailer(false);
    // Stop the video when closing the modal
    if (iframeRef.current && iframeRef.current.src) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleRatingChange = (rating: number) => {
    setUserRating(rating);
    setRatingMessage('Rating saved!');
    setTimeout(() => {
      setRatingMessage(null);
    }, 3000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
              <p className="mb-4">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="mx-auto min-h-screen max-w-[100rem] space-y-6 px-2 sm:px-6 lg:px-8 mt-12">
        {anime ? (
          <div>
            <div className="container mx-auto px-2 py-8 mt-12 ">
              {/* Main Content */}
              <div className="flex flex-col gap-8 ">
                {/* Header Section */}
                <div className="rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
                  <Breadcrumbs />
                </div>
               
                <div className="flex flex-col md:flex-row gap-8 ">
                  <div className="w-3/4 md:w-1/3 lg:w-1/4 shrink-0 justify-center items-center ">
                    <img
                      src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
                      alt={anime.title}
                      className="w-full rounded-lg shadow-lg text-white"
                      fetchPriority="high"
                      loading="eager"
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
                  </div>
               
                  <div className="md:w-2/3 lg:w-3/4 flex-grow">
                    <h1 className="text-3xl font-bold text-white">{anime.title}</h1>
                    <h2 className="text-xl text-white mb-4">{anime.title_japanese}</h2>
                   
                    {anime.genres && (
                      <div className="mb-4 text-white">
                        <h3 className="font-medium mb-2 text-white">Genres</h3>
                        <p className="text-[#ffe921] drop-shadow-[0_0_8px_#ffe921] tilt-neon2">{anime.genres.map((genre) => genre.name).join(', ')}</p>
                      </div>
                    )}
                   
                    <p className="text-white mb-4">{anime.synopsis}</p>

                    {anime.trailer?.youtube_id && (
                      <div className="mb-6">
                        <AnimeTrailer
                          trailer={{
                            youtube_id: anime.trailer.youtube_id,
                            embed_url: anime.trailer.embed_url,
                            url: anime.trailer.url
                          }}
                          onTrailerClick={handleTrailerClick}
                        />
                      </div>
                    )}

                    <div className="flex md:flex-row flex-col w-full gap-8 justify-between mt-12 ">
                      <div className="w-1/1 md:w-1/2">
                        <h3 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon4 mb-4">Information</h3>
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
                            <dt className="text-white">Rating</dt>
                            <dd className="text-white">{anime.rating}</dd>
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
                      <div className="w-1/1 md:w-1/2">
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
                          {anime.score && (
                            <div className="flex justify-between border-t">
                              <dt className="text-white">Score</dt>
                              <dd className="text-white">#{anime.score.toLocaleString()}</dd>
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
                <div className="relative mt-8" id="reviews" ref={reviewsRef}>
                  <AnimeReviews
                    reviews={reviews}
                    currentReviewPage={currentReviewPage}
                    totalPages={totalPages}
                    reviewsPerPage={reviewsPerPage}
                    isLoading={isLoading}
                    hasLoaded={hasLoadedReviews}
                    onPageChange={setCurrentReviewPage}
                    onReviewClick={handleReviewClick}
                  />
                </div>

                {/* Episodes Section */}
                <div className="mt-8" id="episodes" ref={episodesRef}>
                  <Episodes 
                    animeId={Number(id)} 
                    episodes={episodes} 
                    isLoading={isLoading}
                    hasLoaded={hasLoadedEpisodes}
                  />
                </div>

                {/* Recommendations Section */}
                <div className="mt-8" id="recommendations" ref={recommendationsRef}>
                  <AnimeRecommendations
                    recommendations={recommendations}
                    isLoading={isLoading}
                    hasLoaded={hasLoadedRecommendations}
                    onPageChange={setRecommendationsPage}
                    currentPage={recommendationsPage}
                    itemsPerPage={recommendationsPerPage}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
            <div className="w-full max-w-3xl">
              {/* Skeleton loader for main content */}
              <div className="flex flex-col md:flex-row gap-8 animate-pulse">
                {/* Skeleton for image */}
                <div className="w-3/4 md:w-1/3 lg:w-1/4 shrink-0">
                  <div className="bg-black/20 rounded-lg w-full h-[350px]"></div>
                  <div className="mt-4 space-y-2">
                    <div className="bg-black/20 h-5 rounded w-full"></div>
                    <div className="bg-black/20 h-5 rounded w-full"></div>
                    <div className="bg-black/20 h-5 rounded w-full"></div>
                  </div>
                </div>
                {/* Skeleton for details */}
                <div className="md:w-2/3 lg:w-3/4 flex-grow">
                  <div className="bg-black/20 h-8 rounded w-3/4 mb-2"></div>
                  <div className="bg-black/20 h-6 rounded w-1/2 mb-4"></div>
                  <div className="bg-black/20 h-4 rounded w-full mb-2"></div>
                  <div className="bg-black/20 h-4 rounded w-full mb-2"></div>
                  <div className="bg-black/20 h-4 rounded w-3/4 mb-6"></div>
                  <div className="bg-black/20 h-40 rounded w-full mb-6"></div>
                  <div className="flex md:flex-row flex-col w-full gap-8 justify-between mt-12">
                    <div className="w-1/1 md:w-1/2">
                      <div className="bg-black/20 h-6 rounded w-1/3 mb-4"></div>
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex justify-between">
                            <div className="bg-black/20 h-4 rounded w-1/3"></div>
                            <div className="bg-black/20 h-4 rounded w-1/3"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="w-1/1 md:w-1/2">
                      <div className="bg-black/20 h-6 rounded w-1/3 mb-4"></div>
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex justify-between">
                            <div className="bg-black/20 h-4 rounded w-1/3"></div>
                            <div className="bg-black/20 h-4 rounded w-1/3"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Skeleton for characters section */}
              <div className="mt-12">
                <div className="bg-black/20 h-6 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-black/20 h-60 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Review Modal */}
        {selectedReview && (
          <Modal
            isOpen={!!selectedReview}
            onClose={handleCloseReviewModal}
            title={`Review by ${selectedReview.user.username}`}
          >
            <div className="p-8">
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
            onClose={handleCloseTrailerModal}
            title={`${anime?.title || 'Anime'} - Trailer`}
          >
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                ref={iframeRef}
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
