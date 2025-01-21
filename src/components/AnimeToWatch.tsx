import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { LazyLoad } from './LazyLoad';

interface WatchlistAnime {
  id: number;
  anime_id: number;
  anime_title: string;
  anime_image: string;
  status: 'planning' | 'watching' | 'completed' | 'dropped';
}

export function AnimeToWatch() {
  const { user, supabase } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistAnime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        const { data, error } = await supabase
          .from('anime_watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWatchlist(data || []);
      } catch (err) {
        console.error('Error fetching watchlist:', err);
        setError('Failed to load watchlist. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, supabase]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your watchlist.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const updateAnimeStatus = async (animeId: number, newStatus: WatchlistAnime['status']) => {
    try {
      const { error } = await supabase
        .from('anime_watchlist')
        .update({ status: newStatus })
        .eq('id', animeId);

      if (error) throw error;

      setWatchlist(watchlist.map(anime => 
        anime.id === animeId ? { ...anime, status: newStatus } : anime
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const removeFromWatchlist = async (animeId: number) => {
    try {
      const { error } = await supabase
        .from('anime_watchlist')
        .delete()
        .eq('id', animeId);

      if (error) throw error;

      setWatchlist(watchlist.filter(anime => anime.id !== animeId));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to remove from watchlist');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">My Watchlist</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Your watchlist is empty
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {watchlist.map((anime) => (
            <div key={anime.id} className="relative group">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl">
                <Link to={`/anime/${anime.anime_id}`} className="block">
                  <div className="relative aspect-[3/4]">
                    <LazyLoad>
                      <img
                        src={anime.anime_image}
                        alt={anime.anime_title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </LazyLoad>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm text-black line-clamp-2">{anime.anime_title}</h3>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <select
                    value={anime.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateAnimeStatus(anime.id, e.target.value as WatchlistAnime['status']);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-sm text-black rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="watching">Watching</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWatchlist(anime.id);
                }}
                className="absolute top-2 right-2 bg-red-500/70 text-black w-8 h-8 rounded-full transition-opacity duration-200 flex items-center justify-center hover:bg-red-600/80"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
