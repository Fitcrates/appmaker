import React, { useEffect, useState } from 'react';
import { Link, useLocation  } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';

interface AnimeData {
  mal_id: number;
  title: string;
  synopsis: string;
  images: {
    jpg: {
      large_image_url: string;
    };
  };
  score: number;
  genres: Array<{ name: string }>;
  studios: Array<{ name: string }>;
  rating: string;
}

export function Slideshow() {
  const [currentAnime, setCurrentAnime] = useState<AnimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const location = useLocation();

  const MAX_RETRIES = 3;

  useEffect(() => {
    // Scroll to top only when navigating to /genres
    if (location.pathname === '/genres') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const fetchRandomAnime = async () => {
    if (retryCount >= MAX_RETRIES) {
      setError('Unable to fetch appropriate content. Please try again later.');
      setRetryCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    setImageLoaded(false);
    
    try {
      const response = await fetchFromAPI<any>('/random/anime');
      if (response?.data) {
        // Check if the anime is Rx-rated
        const isRxRated = response.data.rating === 'Rx - Hentai';
        
        if (isRxRated) {
          // If it's Rx-rated, increment retry count and try again after a delay
          setRetryCount(prev => prev + 1);
          setTimeout(fetchRandomAnime, 1000); // Add 1 second delay between retries
          return;
        }
        
        // Reset retry count on success
        setRetryCount(0);
        setCurrentAnime(response.data);

        // Preload the image
        const img = new Image();
        img.src = response.data.images.jpg.large_image_url;
        img.onload = () => setImageLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching random anime:', error);
      setError('Failed to load random anime');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomAnime();
    // Change interval to 15 seconds to reduce API load
    const interval = setInterval(fetchRandomAnime, 25000);
    return () => {
      clearInterval(interval);
      setRetryCount(0); // Reset retry count on unmount
    };
  }, []);

  if (isLoading && !currentAnime) {
    return (
      <div className="relative h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !currentAnime) {
    return (
      <div className="relative h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentAnime) return null;

  return (
    <div className="relative h-screen group overflow-hidden bg-black">
      {/* Placeholder Image */}
      <div
        className={`absolute inset-0 bg-center overflow-hidden bg-no-repeat md:bg-contain bg-black placeholder-blur ${imageLoaded ? 'loaded' : ''}`}
        style={{
          backgroundImage: `url('/124145l.webp')`,
          backgroundPosition: 'center right',
        }}
      />
  
      {/* Background Image with Link */}
      <Link to={`/anime/${currentAnime.mal_id}`}>
        <div
          className={`absolute inset-0 bg-center bg-no-repeat md:bg-contain bg-black main-image ${imageLoaded ? 'loaded' : ''}`}
          style={{
            backgroundImage: `url(${currentAnime.images.jpg.large_image_url})`,
            backgroundPosition: 'center right',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40"></div>
        </div>
      </Link>
  
      <div className="relative mx-auto w-full h-full flex justify-center items-center">
        <div className="w-full">
          <div className="min-h-screen max-w-[100rem] space-y-6 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            {/* Mobile Navigation Buttons - Now above title */}
            <div className="flex justify-between xl:hidden mb-6 space-x-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  fetchRandomAnime();
                }}
                className="p-2 text-black drop-shadow-[0_0_8px_#3af5fc] bg-[#3af5fc] rounded-full hover:bg-[#ff13f0] hover:drop-shadow-[0_0_8px_#ff13f0]"
                aria-label="Previous anime"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  fetchRandomAnime();
                }}
                className="p-2 text-black drop-shadow-[0_0_8px_#3af5fc] bg-[#3af5fc] rounded-full hover:bg-[#ff13f0] hover:drop-shadow-[0_0_8px_#ff13f0]"
                aria-label="Next anime"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
  
            <Link
              to={`/anime/${currentAnime.mal_id}`}
              className="inline-block hover:text-blue-400 transition-colors"
            >
              <h2 className="text-3xl text-white font-bold mb-2">{currentAnime.title}</h2>
            </Link>
  
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-lg text-white">{currentAnime.score || 'N/A'}</span>
            </div>
  
            {currentAnime.genres && (
              <div className="flex flex-wrap gap-2">
                {currentAnime.genres.map((genre) => (
                  <span
                    key={genre.name}
                    className="px-3 py-1 bg-[#3af5fc] drop-shadow-[0_0_8px_#3af5fc] rounded-full text-black font-semibold"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
  
            <p className="text-gray-300 line-clamp-4">{currentAnime.synopsis}</p>
  
            {currentAnime.studios && currentAnime.studios.length > 0 && (
              <div className="text-sm text-gray-300">
                Studio: {currentAnime.studios.map((studio) => studio.name).join(', ')}
              </div>
            )}
  
            {/* Learn more button */}
            <div className="flex justify-start"> 
              <Link
                to={`/anime/${currentAnime.mal_id}`}
                className="cyberpunk-neon-btn"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
  
      {/* Desktop Navigation Buttons - Hidden on mobile */}
      <button
        onClick={(e) => {
          e.preventDefault();
          fetchRandomAnime();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-black drop-shadow-[0_0_8px_#3af5fc] bg-[#3af5fc] rounded-full hover:bg-[#ff13f0] hover:drop-shadow-[0_0_8px_#ff13f0] hidden xl:block"
        aria-label="Previous anime"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          fetchRandomAnime();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-black drop-shadow-[0_0_8px_#3af5fc] bg-[#3af5fc] rounded-full hover:bg-[#ff13f0] hover:drop-shadow-[0_0_8px_#ff13f0] hidden xl:block"
        aria-label="Next anime"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
