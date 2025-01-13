import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFromAPI } from '../utils/api';
import { LazyLoad } from '../components/LazyLoad';
import { Star } from 'lucide-react';

interface Genre {
  mal_id: number;
  name: string;
  count: number;
}

interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  score: number;
}

interface GenreAnimeResponse {
  data: Anime[];
  pagination: {
    has_next_page: boolean;
    last_visible_page: number;
  };
}

export function GenrePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        console.log('Fetching genres...');
        const response = await fetchFromAPI<{ data: Genre[] }>('/genres/anime');
        console.log('Genres response:', response);
        if (response?.data) {
          setGenres(response.data);
          // Select the first genre by default
          if (response.data.length > 0) {
            setSelectedGenre(response.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
        setError('Failed to load genres');
      }
    };

    fetchGenres();
  }, []);

  // Fetch anime for selected genre
  useEffect(() => {
    const fetchAnimeByGenre = async () => {
      if (!selectedGenre) return;

      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching anime for genre ${selectedGenre.name}...`);
        const response = await fetchFromAPI<GenreAnimeResponse>(
          `/anime?genres=${selectedGenre.mal_id}&page=${currentPage}&limit=24&order_by=score&sort=desc`
        );
        console.log('Anime response:', response);
        if (response?.data) {
          setAnimeList(response.data);
        }
      } catch (error) {
        console.error('Error fetching anime by genre:', error);
        setError('Failed to load anime for this genre');
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeByGenre();
  }, [selectedGenre, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Genre Selection */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Anime Genres</h1>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.mal_id}
                onClick={() => {
                  setSelectedGenre(genre);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedGenre?.mal_id === genre.mal_id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-800'
                }`}
              >
                {genre.name}
                <span className="ml-2 text-sm opacity-75">({genre.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Genre Content */}
        {selectedGenre && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {selectedGenre.name} Anime
            </h2>

            {error ? (
              <div className="text-red-600 text-center py-8">{error}</div>
            ) : loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {animeList.map((anime) => (
                  <LazyLoad key={anime.mal_id}>
                    <Link
                      to={`/anime/${anime.mal_id}`}
                      className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <img
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {anime.title}
                        </h3>
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span>{anime.score || 'N/A'}</span>
                        </div>
                      </div>
                    </Link>
                  </LazyLoad>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
