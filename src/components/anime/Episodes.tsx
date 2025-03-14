import React, { useState, useEffect } from 'react';
import { fetchFromAPI, RequestPriority } from '../../utils/api';
import { Pagination } from '../Pagination';
import { Modal } from '../Modal';
import { Episode, EpisodeDetail, EpisodesResponse, EpisodeDetailResponse } from '../../types/episode';

interface EpisodesProps {
  animeId: number;
  isLoading?: boolean;
}

export const Episodes: React.FC<EpisodesProps> = ({ 
  animeId, 
  isLoading: externalIsLoading
}) => {
  const [allEpisodeData, setAllEpisodeData] = useState<Episode[]>([]);
  const [currentPageEpisodes, setCurrentPageEpisodes] = useState<Episode[]>([]);
  const [episodeDetail, setEpisodeDetail] = useState<EpisodeDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external loading state if provided, otherwise use internal
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;

  // Load all episodes once
  useEffect(() => {
    const fetchEpisodes = async () => {
      setInternalIsLoading(true);
      setError(null);
      try {
        const response = await fetchFromAPI<EpisodesResponse>(
          `/anime/${animeId}/episodes`,
          {},
          RequestPriority.LOW
        );
        
        if (response?.data && Array.isArray(response.data)) {
          setAllEpisodeData(response.data);
          const totalPages = Math.max(1, Math.ceil(response.data.length / 10));
          setTotalPages(totalPages);
        } else {
          setError('No episodes found');
          setAllEpisodeData([]);
          setTotalPages(1);
        }
      } catch (err) {
        setError('Failed to load episodes');
        console.error('Error fetching episodes:', err);
        setAllEpisodeData([]);
        setTotalPages(1);
      } finally {
        setInternalIsLoading(false);
      }
    };

    fetchEpisodes();
  }, [animeId]);

  // Update current page episodes when page changes or all episodes data changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    setCurrentPageEpisodes(allEpisodeData.slice(startIndex, endIndex));
  }, [currentPage, allEpisodeData]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to episodes section with smooth behavior
    const episodesSection = document.getElementById('episodes');
    if (episodesSection) {
      episodesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEpisodeClick = async (episode: Episode) => {
    setIsLoadingDetail(true);
    setIsModalOpen(true);
    try {
      const response = await fetchFromAPI<EpisodeDetailResponse>(
        `/anime/${animeId}/episodes/${episode.mal_id}`,
        {},
        RequestPriority.LOW
      );
      if (response?.data) {
        setEpisodeDetail(response.data);
      }
    } catch (err) {
      console.error('Error fetching episode details:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div>
      <h2 className="bg-clip-text text-[#ff13f0] drop-shadow-[0_0_8px_#ff13f0] tilt-neon mb-4">Episodes</h2>
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {isLoading ? (
              // Loading skeleton
              [...Array(10)].map((_, index) => (
                <div
                  key={index}
                  className="relative p-4 bg-black/20 rounded-lg shadow ring-1 ring-white/20 flex flex-col min-h-[150px] animate-pulse"
                >
                  <div className="flex-grow">
                    <div className="h-6 black/20 rounded w-3/4 mb-2"></div>
                    <div className="h-4 black/20 rounded w-1/2 mt-2"></div>
                    <div className="h-4 black/20 rounded w-1/3 mt-2"></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-6 black/20 rounded w-20"></div>
                    <div className="h-6 black/20 rounded w-16"></div>
                  </div>
                </div>
              ))
            ) : (
              currentPageEpisodes.map((episode) => (
                <div
                  key={episode.mal_id}
                  className="relative p-4 bg-black/20 rounded-lg shadow hover:ring-1 hover:ring-[#ff13f0]/50 transition-all duration-300 ring-1 ring-white/20 flex flex-col min-h-[150px]"
                  onClick={() => handleEpisodeClick(episode)}
                >
                  <div className="flex-grow">
                    <h3 className="font-medium text-white">Episode <span className="notranslate">{episode.mal_id}</span>: {episode.title}</h3>
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
                        Score: <span className="notranslate">{episode.score}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </div>
        </>
      )}

      {/* Episode Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Episode Details"
      >
        {isLoadingDetail ? (
          <div className="animate-pulse">
            <div className="h-8 bg-black/20 rounded w-3/4 mb-4 p-4"></div>
            <div className="h-4 bg-black/20 rounded w-1/2 mb-2 p-4"></div>
            <div className="h-4 bg-black/20 rounded w-full mb-2 p-4"></div>
            <div className="h-4 bg-black/20 rounded w-3/4 p-4"></div>
          </div>
        ) : episodeDetail ? (
          <div>
            <h3 className="text-xl text-white font-semibold m-4">
              Episode <span className="notranslate text-white ">{episodeDetail.mal_id}</span>: {episodeDetail.title}
            </h3>
            <div className="flex flex-wrap gap-4 mb-4 text-white p-4">
              {episodeDetail.aired && (
                <div>
                  <span className="font-medium text-white">Aired:</span>{' '}
                  {new Date(episodeDetail.aired).toLocaleDateString()}
                </div>
              )}
              {episodeDetail.score !== undefined && (
                <div>
                  <span className="font-medium p-4">Score:</span>{' '}
                  <span className="notranslate">{episodeDetail.score}</span>
                </div>
              )}
              {episodeDetail.filler && (
                <span className="px-2 py-1 text-xs bg-[#eafc49] drop-shadow-[0_0_4px_#eafc49] text-black rounded-lg">
                  Filler Episode
                </span>
              )}
              {episodeDetail.recap && (
                <span className="px-2 py-1 text-xs bg-[#41f0e1] drop-shadow-[0_0_4px_#41f0e1] text-black rounded-lg">
                  Recap Episode
                </span>
              )}
            </div>
            <div className="text-base text-white/90 p-4">
              {episodeDetail.synopsis || 'No synopsis available.'}
            </div>
          </div>
        ) : (
          <div className="text-center text-white/50">
            No episode details available.
          </div>
        )}
      </Modal>
    </div>
  );
};
