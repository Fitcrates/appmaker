// TopMoviesCarusel.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchFromAPI } from '../utils/api';
import ParallaxGallery from '../components/ParalaxVid';
import '../AnimeCarusel.css';

interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  type: string;
}

const TopMoviesCarusel: React.FC = () => {
  const [movies, setMovies] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        setIsLoading(true);
        const response = await fetchFromAPI<any>('/top/anime', {
          type: 'movie',
          limit: 7
        });

        if (response?.data) {
          setMovies(response.data);
        } else {
          setError('Failed to load top movies');
        }
      } catch (error) {
        console.error('Error fetching top movies:', error);
        setError('Failed to load top movies. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopMovies();
  }, []);

  if (isLoading) {
    return (
      <div className="carousel-container loading">
        <div className="loading-text">Loading top movies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="carousel-container error">
        <div className="error-text">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-6 mx-auto px-0 sm:px-6 lg:px-8 ">
    <span className='text-left tilt-neon bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] font-bold'>  Top Movies</span>
    <div className="carousel-container">
      <div className="carousel">
        <div className="carousel-title ">
        <img src="/media/lucy.png" className="w-full h-auto max-w-[500px] md:max-w-[550px] lg:max-w-[600px]"></img>

        </div>
        
        <div className="cards-container">
          {movies.map((movie, index) => (
            <Link 
              key={movie.mal_id}
              to={`/anime/${movie.mal_id}`}
              className="card  "
              style={{
                transform: `rotateY(${index * (360 / movies.length)}deg) translateZ(350px)`
              }}
            >
              <img 
                src={movie.images.jpg.image_url} 
                alt={movie.title} 
                loading="lazy"

              />
              <div className="movie-title">{movie.title}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export default TopMoviesCarusel;