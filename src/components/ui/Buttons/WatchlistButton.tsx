import React from 'react';
import { Bookmark } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

interface WatchlistButtonProps {
  isInWatchlist: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({
  isInWatchlist,
  onClick
}) => {
  return (
    <Tooltip content="Save to watchlist">
      <button
        onClick={onClick}
        className="absolute top-2 right-12 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80"
      >
        <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : 'fill-none'}`} />
      </button>
    </Tooltip>
  );
};
