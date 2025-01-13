import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
}

export function Slideshow() {
  const [currentAnime, setCurrentAnime] = useState<AnimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomAnime = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchFromAPI<any>('/random/anime');
      if (response?.data) {
        setCurrentAnime(response.data);
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
    const interval = setInterval(fetchRandomAnime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !currentAnime) {
    return (
      <div className="relative h-[500px] bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !currentAnime) {
    return (
      <div className="relative h-[500px] bg-gray-900 flex items-center justify-center text-white">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentAnime) return null;

  return (
    <div className="relative h-screen">
      {/* Background Image with Link */}
      <Link to={`/anime/${currentAnime.mal_id}`}>
        <div
          className="absolute inset-0 bg-center bg-no-repeat md:bg-contain bg-black"
          style={{
            backgroundImage: `url(${currentAnime.images.jpg.large_image_url})`,
            backgroundPosition: 'center right',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40"></div>
        </div>
      </Link>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="w-full md:w-1/2">
          <div className="text-white space-y-4">
            <Link
              to={`/anime/${currentAnime.mal_id}`}
              className="inline-block hover:text-blue-400 transition-colors"
            >
              <h2 className="text-3xl font-bold mb-2">{currentAnime.title}</h2>
            </Link>

            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-lg">{currentAnime.score || 'N/A'}</span>
            </div>

            {currentAnime.genres && (
              <div className="flex flex-wrap gap-2">
                {currentAnime.genres.map((genre) => (
                  <span
                    key={genre.name}
                    className="px-3 py-1 bg-blue-600 rounded-full text-sm"
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

            <Link
              to={`/anime/${currentAnime.mal_id}`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={(e) => {
            e.preventDefault();
            fetchRandomAnime();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
          aria-label="Previous anime"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            fetchRandomAnime();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
          aria-label="Next anime"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
