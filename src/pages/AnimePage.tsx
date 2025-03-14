import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFromAPI } from '../utils/api';
import { Anime } from '../types/anime';
import { AnimeCharacters } from '../components/anime/AnimeCharacters';
import { AnimeReviews } from '../components/anime/AnimeReviews';
import { AnimeRecommendations } from '../components/anime/AnimeRecommendations';
import { Episodes } from '../components/anime/Episodes';
import type { Review } from '../types/review';
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

interface APIResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}

export function AnimePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<AnimeRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [currentRecommendationsPage, setCurrentRecommendationsPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(0);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Loading states
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const reviewsPerPage = 3;
  const recommendationsPerPage = 12;

  // Refs to track loading states
  const reviewsLoaded = useRef(false);
  const episodesLoaded = useRef(false);
  const recommendationsLoaded = useRef(false);

  // Add refs for intersection observers
  const reviewsRef = useRef<HTMLDivElement>(null);
  const episodesRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  const loadReviews = useCallback(async () => {
    if (!id || reviewsLoaded.current) return;
    
    setIsLoadingReviews(true);
    try {
      const response = await fetchFromAPI<APIResponse<Review[]>>(`/anime/${id}/reviews`);
      
      if (response?.data && Array.isArray(response.data)) {
        setReviews(response.data);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      reviewsLoaded.current = true;
      setIsLoadingReviews(false);
    }
  }, [id]);

  const loadRecommendations = useCallback(async () => {
    if (!id || recommendationsLoaded.current) return;
    
    try {
      const response = await fetchFromAPI<APIResponse<AnimeRecommendation[]>>(`/anime/${id}/recommendations`);
      
      if (response?.data && Array.isArray(response.data)) {
        const validRecommendations = response.data.filter((rec: AnimeRecommendation) => rec && rec.entry);
        setRecommendations(validRecommendations);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      recommendationsLoaded.current = true;
      setIsLoadingRecommendations(false);
    }
  }, [id]);

  // Initial data load
  useEffect(() => {
    if (!id) return;
    
    const loadInitialData = async () => {
      if (isLoadingReviews || isLoadingEpisodes || isLoadingRecommendations) return;
      
      setIsLoadingReviews(true);
      setIsLoadingEpisodes(true);
      setIsLoadingRecommendations(true);
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetchFromAPI<APIResponse<Anime>>(`/anime/${id}`);
        
        if (response?.data) {
          setAnime(response.data);
          // Load additional data in parallel after main data loads
          await Promise.all([
            !reviewsLoaded.current && loadReviews(),
            !recommendationsLoaded.current && loadRecommendations()
          ]);
        } else {
          setError('Failed to load anime data');
        }
      } catch (err) {
        console.error('Error fetching anime data:', err);
        setError('Failed to load anime data');
      } finally {
        setIsLoading(false);
        setIsLoadingReviews(false);
        setIsLoadingEpisodes(false);
        setIsLoadingRecommendations(false);
      }
    };

    loadInitialData();
  }, [id, loadReviews, loadRecommendations]);

  // Reset states when anime ID changes
  useEffect(() => {
    reviewsLoaded.current = false;
    episodesLoaded.current = false;
    recommendationsLoaded.current = false;
    setIsLoadingReviews(false);
    setIsLoadingEpisodes(false);
    setIsLoadingRecommendations(false);
    setCurrentReviewPage(1);
    setCurrentRecommendationsPage(1);
    setReviews([]);
    setError(null);
    setIsLoading(true);
    setAnime(null);
  }, [id]);

  // Set up intersection observers for lazy loading sections
  useEffect(() => {
    if (!id) return;
    
    console.log('Setting up intersection observers');
    
    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    };

    const reviewsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !reviewsLoaded.current) {
          console.log('Reviews section is visible, loading data...');
          loadReviews();
        }
      });
    }, options);

    const episodesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !episodesLoaded.current) {
          console.log('Episodes section is visible');
          episodesLoaded.current = true;
        }
      });
    }, options);

    const recommendationsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !recommendationsLoaded.current) {
          console.log('Recommendations section is visible, loading data...');
          loadRecommendations();
        }
      });
    }, options);

    // Ensure refs are available before observing
    setTimeout(() => {
      if (reviewsRef.current) {
        console.log('Observing reviews section');
        reviewsObserver.observe(reviewsRef.current);
      }

      if (episodesRef.current) {
        console.log('Observing episodes section');
        episodesObserver.observe(episodesRef.current);
      }

      if (recommendationsRef.current) {
        console.log('Observing recommendations section');
        recommendationsObserver.observe(recommendationsRef.current);
      }
    }, 500);

    return () => {
      reviewsObserver.disconnect();
      episodesObserver.disconnect();
      recommendationsObserver.disconnect();
    };
  }, [id, loadReviews, loadRecommendations]);

  // Fallback mechanism to ensure data is loaded
  useEffect(() => {
    if (!id) return;
    
    // Set a timeout to load data if not already loaded
    const timeoutId = setTimeout(() => {
      if (!reviewsLoaded.current) {
        console.log('Fallback: Loading reviews data');
        loadReviews();
      }
      
      if (!episodesLoaded.current) {
        console.log('Fallback: Loading episodes data');
        episodesLoaded.current = true;
      }
      
      if (!recommendationsLoaded.current) {
        console.log('Fallback: Loading recommendations data');
        loadRecommendations();
      }
    }, 2000); // 2 seconds after component mounts
    
    return () => clearTimeout(timeoutId);
  }, [id, loadReviews, loadRecommendations]);

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

                {/* Episodes Section */}
                <div className="mt-8" id="episodes" ref={episodesRef}>
                  <Episodes 
                    animeId={Number(id)} 
                    isLoading={isLoadingEpisodes}
                  />
                </div>

                {/* Reviews Section */}
                <div className="relative mt-8" id="reviews" ref={reviewsRef}>
                  <AnimeReviews
                    reviews={reviews}
                    currentReviewPage={currentReviewPage}
                    reviewsPerPage={reviewsPerPage}
                    isLoading={isLoadingReviews}
                    hasLoaded={reviewsLoaded.current}
                    onPageChange={setCurrentReviewPage}
                    onReviewClick={handleReviewClick}
                  />
                </div>

                {/* Recommendations Section */}
                <div className="mt-8" id="recommendations" ref={recommendationsRef}>
                  <AnimeRecommendations
                    recommendations={recommendations}
                    isLoading={isLoadingRecommendations}
                    hasLoaded={recommendationsLoaded.current}
                    onPageChange={setCurrentRecommendationsPage}
                    currentPage={currentRecommendationsPage}
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
