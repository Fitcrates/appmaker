import React, { useEffect, useState, useMemo } from 'react';
import { Pagination } from '../Pagination';
import { fetchFromAPI, RequestPriority } from '../../utils/api';
import { Modal } from '../Modal';
import { useLocation } from 'react-router-dom';
import { saveNavigationState, getNavigationState } from '../../utils/navigationState';

interface Episode {
  mal_id: number;
  title: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
  score?: number;
  filler?: boolean;
  recap?: boolean;
  forum_url?: string;
}

interface DetailedEpisode extends Episode {
  synopsis: string;
  length: string;
  aired: string;
}

interface EpisodesProps {
  animeId: number;
  episodes: Episode[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
}

export function Episodes({ animeId, episodes }: EpisodesProps) {
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>(episodes);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<DetailedEpisode | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const location = useLocation();

  const EPISODES_PER_PAGE = 10;

  useEffect(() => {
    const savedState = getNavigationState();
    if (savedState?.source?.component === 'Episodes' && savedState?.page) {
      setCurrentPage(savedState.page);
    }
  }, []);

  useEffect(() => {
    if (currentPage > 0) {  // Only save if page is valid
      saveNavigationState({
        pathname: location.pathname,
        search: location.search,
        page: currentPage,
        source: {
          component: 'Episodes'
        }
      });
    }
  }, [currentPage, location.pathname, location.search]);

  useEffect(() => {
    if (location.state?.page) {
      setCurrentPage(location.state.page);
    }
  }, [location.state]);

  useEffect(() => {
    setAllEpisodes(episodes);
    if (episodes.length > 0) {
      setTotalPages(Math.ceil(episodes.length / EPISODES_PER_PAGE));
    }
  }, [episodes]);

  const displayedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * EPISODES_PER_PAGE;
    const end = start + EPISODES_PER_PAGE;
    return allEpisodes.slice(start, end);
  }, [allEpisodes, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleEpisodeClick = async (episode: Episode) => {
    setIsLoadingDetails(true);
    setSelectedEpisode(null);

    try {
      const response = await fetchFromAPI<DetailedEpisode>(
        `/anime/${animeId}/episodes/${episode.mal_id}`,
        RequestPriority.Low
      );
      if (response?.data) {
        setSelectedEpisode(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (isLoading) return <div className="animate-pulse">Loading episodes...</div>;

  return (
    <div className="relative space-y-4">
      {displayedEpisodes.length > 0 ? (
        <>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {displayedEpisodes.map((episode) => (
              <div
                key={episode.mal_id}
                className="relative p-4 bg-black/20 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ring-1 ring-white/20"
                onClick={() => handleEpisodeClick(episode)}
              >
                <h3 className="font-medium text-white">Episode {episode.mal_id}: {episode.title}</h3>
                {episode.title_japanese && (
                  <p className="text-sm text-white/80 mt-2">{episode.title_japanese}</p>
                )}
                {episode.aired && (
                  <p className="text-sm text-white/50 mt-2 mb-8">
                    Aired: {new Date(episode.aired).toLocaleDateString()}
                  </p>
                )}
                {/* Show filler/recap/score for each episode */}
                <div className="absolute bottom-2 left-2 flex gap-2 ml-2">
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <p>No episodes available.</p>
      )}

      {/* Display modal with details */}
      {selectedEpisode && (
        <Modal
          isOpen={!!selectedEpisode}
          onClose={() => setSelectedEpisode(null)}
          title={`Episode ${selectedEpisode.mal_id}: ${selectedEpisode.title}`}
        >
          <div className="p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4 text-white">{selectedEpisode.title}</h2>
            {selectedEpisode.title_japanese && (
              <p className="text-white/80 mb-4">{selectedEpisode.title_japanese}</p>
            )}
            {selectedEpisode.aired && (
              <p className="text-sm text-white/50 mb-4">
                Aired: {new Date(selectedEpisode.aired).toLocaleDateString()}
              </p>
            )}
            <p className="whitespace-pre-wrap text-white">{selectedEpisode.synopsis}</p>

            {/* Filler/recap/score inside modal */}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedEpisode.filler && (
                <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">
                  Filler
                </span>
              )}
              {selectedEpisode.recap && (
                <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                  Recap
                </span>
              )}
              {selectedEpisode.score !== undefined && (
                <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                  Score: {selectedEpisode.score}
                </span>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
