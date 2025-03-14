import React from 'react';

interface HentaiFilterProps {
  hideHentai: boolean;
  setHideHentai: (hide: boolean) => void;
}

export const HentaiFilter: React.FC<HentaiFilterProps> = ({ hideHentai, setHideHentai }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="hideHentai"
        checked={hideHentai}
        onChange={(e) => setHideHentai(e.target.checked)}
        className="sr-only" // Use sr-only to visually hide but keep it accessible
      />
      <div
        className={`w-5 h-5 border-2 border-[#40ffff] rounded cursor-pointer flex items-center justify-center ${
          hideHentai ? 'bg-[#40ffff] border-[#40ffff]' : 'bg-transparent border-[#40ffff]'
        }`}
        onClick={() => setHideHentai(!hideHentai)}
      >
        {hideHentai && (
          <svg
            width="1rem"
            height="1rem"
            viewBox="0 0 16 16" // Adjusted viewBox for better scaling
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M3.3 8L6.5 11L12.5 5" 
              stroke="black" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <label htmlFor="hideHentai" className="text-white text-sm cursor-pointer">
        Hide Hentai content (Rx rated)
      </label>
    </div>
  );
};
