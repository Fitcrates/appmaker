import React, { useState, useEffect } from 'react';
import { fetchFromAPI, RequestPriority } from '../../utils/api';
import { Pagination } from '../Pagination';
import { Modal } from '../Modal';
import { Episode } from '../../types/episode';

// Extended interface for detailed episode information
interface EpisodeDetail extends Episode {
  synopsis?: string;
}

interface PaginationData {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

interface EpisodesResponse {
  data: Episode[];
  pagination: PaginationData;
}

interface EpisodeDetailResponse {
  data: EpisodeDetail;
}

interface EpisodesProps {
  animeId: number;
  episodes: Episode[];
  isLoading?: boolean;
  hasLoaded?: boolean;
}

export const Episodes: React.FC<EpisodesProps> = ({ 
  animeId, 
  episodes, 
  isLoading: externalIsLoading, 
  hasLoaded: externalHasLoaded 
}) => {
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>(episodes);
  const [episodeDetail, setEpisodeDetail] = useState<EpisodeDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external loading state if provided, otherwise use internal
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const hasLoaded = externalHasLoaded !== undefined ? externalHasLoaded : allEpisodes.length > 0;

  const EPISODES_PER_PAGE = 10;

  // Load episodes if not provided
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (episodes.length === 0) {
        setInternalIsLoading(true);
        try {
          const response = await fetchFromAPI<EpisodesResponse>(
            `/anime/${animeId}/episodes`,
            { page: currentPage.toString() },
            RequestPriority.LOW
          );
          setAllEpisodes(response.data);
          setPagination(response.pagination);
          setTotalPages(response.pagination.last_visible_page);
          setInternalIsLoading(false);
        } catch (err) {
          setError('Failed to load episodes');
          setInternalIsLoading(false);
          console.error('Error fetching episodes:', err);
        }
      }
    };

    fetchEpisodes();
  }, [animeId, currentPage, episodes]);

  // Update episodes when props change
  useEffect(() => {
    if (episodes.length > 0) {
      setAllEpisodes(episodes);
      setTotalPages(Math.ceil(episodes.length / EPISODES_PER_PAGE));
    }
  }, [episodes]);

  const indexOfLastEpisode = currentPage * EPISODES_PER_PAGE;
  const indexOfFirstEpisode = indexOfLastEpisode - EPISODES_PER_PAGE;
  const displayedEpisodes = allEpisodes.slice(indexOfFirstEpisode, indexOfLastEpisode);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: document.getElementById('episodes')?.offsetTop || 0, behavior: 'smooth' });
  };

  const fetchEpisodeDetail = async (episodeId: number) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetchFromAPI<EpisodeDetailResponse>(
        `/anime/${animeId}/episodes/${episodeId}`,
        {},
        RequestPriority.MEDIUM
      );
      
      if (response && response.data) {
        setEpisodeDetail(response.data);
        setIsModalOpen(true);
      } else {
        setError('Failed to load episode details');
      }
    } catch (err) {
      console.error('Error fetching episode details:', err);
      setError('Failed to load episode details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleEpisodeClick = (episode: Episode) => {
    fetchEpisodeDetail(episode.mal_id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEpisodeDetail(null);
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Episodes</h2>
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 min-h-[10rem] sm:min-h-[10rem] md:min-h-[10rem]">
          {[...Array(10)].map((_, index) => (
            <div 
              key={index}
              className="relative p-4 bg-black/20 rounded-lg shadow animate-pulse ring-1 ring-white/20 flex flex-col min-h-[150px]"
            >
              <div className="flex-grow">
                <div className="h-5 bg-black/20 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-black/20 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-black/20 rounded w-2/3 mb-4"></div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-6 bg-black/20 rounded w-16"></div>
                <div className="h-6 bg-black/20 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Episodes</h2>
        <div className="text-white text-center p-4">{error}</div>
      </div>
    );
  }

  if (!hasLoaded && !isLoading) {
    return (
      <div>
        <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Episodes</h2>
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 min-h-[10rem] sm:min-h-[10rem] md:min-h-[10rem]">
          {[...Array(10)].map((_, index) => (
            <div 
              key={index}
              className="relative p-4 bg-black/20 rounded-lg shadow animate-pulse ring-1 ring-white/20 flex flex-col min-h-[150px]"
            >
              <div className="flex-grow">
                <div className="h-5 bg-black/20 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-black/20 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-black/20 rounded w-2/3 mb-4"></div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-6 bg-black/20 rounded w-16"></div>
                <div className="h-6 bg-black/20 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!allEpisodes || allEpisodes.length === 0) {
    return (
      <div>
        <h2 className="bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] tilt-neon mb-4">Episodes</h2>
        <div className="text-white text-center p-4">
          No episodes information available.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Episodes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {displayedEpisodes.map((episode) => (
          <div
            key={episode.mal_id}
            className="relative p-4 bg-black/20 rounded-lg shadow hover:ring-1 hover:ring-[#ff13f0]/50 transition-all duration-300 ring-1 ring-white/20 flex flex-col min-h-[150px]"
            onClick={() => handleEpisodeClick(episode)}
          >
            <div className="flex-grow">
              <h3 className="font-medium text-white">Episode {episode.mal_id}: {episode.title}</h3>
              {episode.title_japanese && (
                <p className="text-sm text-white/80 mt-2">{episode.title_japanese}</p>
              )}
              {episode.aired && (
                <p className="text-sm text-white/50 mt-2">
                  Aired: {new Date(episode.aired).toLocaleDateString()}
                </p>
              )}
            </div>
            
            {/* Badge container at bottom with consistent positioning */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click from triggering
                  handleEpisodeClick(episode);
                }}
                className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                View Details
              </button>
              
              {episode.filler && (
                <span className="px-2 py-1 text-xs bg-[#eafc49] drop-shadow-[0_0_4px_#eafc49] text-black rounded-lg">
                  Filler
                </span>
              )}
              {episode.recap && (
                <span className="px-2 py-1 text-xs bg-[#41f0e1] drop-shadow-[0_0_4px_#41f0e1] text-black rounded-lg">
                  Recap
                </span>
              )}
              {episode.score !== undefined && (
                <span className="px-2 py-1 text-xs bg-[#45f745] drop-shadow-[0_0_4px_#45f745] text-black rounded-lg">
                  Score: {episode.score}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Episode Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={episodeDetail ? `Episode ${episodeDetail.mal_id}: ${episodeDetail.title}` : 'Episode Details'}
      >
        <div className="p-6">
          {isLoadingDetail ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : episodeDetail ? (
            <div className="text-white">
              {episodeDetail.synopsis ? (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Synopsis</h3>
                  <p className="text-white/90">{episodeDetail.synopsis}</p>
                </div>
              ) : (
                <p className="mb-6 text-white/70">No synopsis available for this episode.</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {episodeDetail.aired && (
                  <div>
                    <h4 className="text-sm font-medium text-white/70">Aired</h4>
                    <p>{new Date(episodeDetail.aired).toLocaleDateString()}</p>
                  </div>
                )}
                
                {episodeDetail.score !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium text-white/70">Score</h4>
                    <p>{episodeDetail.score}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {episodeDetail.filler && (
                  <span className="px-2 py-1 text-xs bg-[#eafc49] drop-shadow-[0_0_4px_#eafc49] text-black rounded-lg">
                    Filler
                  </span>
                )}
                {episodeDetail.recap && (
                  <span className="px-2 py-1 text-xs bg-[#41f0e1] drop-shadow-[0_0_4px_#41f0e1] text-black rounded-lg">
                    Recap
                  </span>
                )}
              </div>
              
              {episodeDetail.url && (
                <div className="mt-6">
                  <a 
                    href={episodeDetail.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block cyberpunk-neon-btn"
                  >
                    View on MyAnimeList
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white text-center">
              Failed to load episode details. Please try again.
            </div>
          )}
        </div>
      </Modal>
     </div>
  );
};