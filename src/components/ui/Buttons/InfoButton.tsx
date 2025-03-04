import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

interface InfoButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export const InfoButton: React.FC<InfoButtonProps> = ({
  onClick
}) => {
  return (
    <Tooltip content="Information">
      <button
        className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-black/80"
        onClick={onClick}
      >
        <Info className="w-4 h-4" />
      </button>
    </Tooltip>
  );
};
