import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageHover?: (page: number) => void;
  isLoading: boolean;
  className?: string;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  onPageHover, 
  isLoading,
  className = '' 
}: PaginationProps) {
  const [goToPage, setGoToPage] = useState('');

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
    setGoToPage('');
  };

  const handleMouseEnter = (page: number) => {
    if (onPageHover && !isLoading && page !== currentPage) {
      onPageHover(page);
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-2 mt-4 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        onMouseEnter={() => handleMouseEnter(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="text-white hover:bg-[#fec859] hover:text-black rounded-lg disabled:opacity-50 px-2 py-2"
      >
        <ChevronLeft />
      </button>

      {/* First Page Button */}
      {currentPage !== 1 && (
        <button
          onClick={() => onPageChange(1)}
          onMouseEnter={() => handleMouseEnter(1)}
          disabled={isLoading}
          className=" rounded-lg ring-1 ring-white/40 text-white hover:bg-[#fec859] hover:text-black disabled:opacity-50 px-2 "
        >
          <span className="notranslate">1</span>
        </button>
      )}

      {/* Current Page Button */}
      <span
        className="rounded-lg cyberpunk-neon2-btn text-white"
        style={{
          padding: '1px 6px',
        }}
      >
        <span className="notranslate">{currentPage}</span>
      </span>

      {/* Last Page Button */}
      {currentPage !== totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          onMouseEnter={() => handleMouseEnter(totalPages)}
          disabled={isLoading}
          className="rounded-lg ring-1 ring-white/40 text-white hover:bg-[#fec859] hover:text-black disabled:opacity-50 px-2"
        >
          <span className="notranslate">{totalPages}</span>
        </button>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        onMouseEnter={() => handleMouseEnter(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="text-white hover:bg-[#fec859] hover:text-black rounded-lg disabled:opacity-50 px-2 py-2"
      >
        <ChevronRight />
      </button>

      {/* Go-to-Page Input */}
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min="1"
          max={totalPages}
          value={goToPage}
          onChange={(e) => setGoToPage(e.target.value)}
          className="w-16 px-2 py-2 text-sm bg-transparent ring-1 ring-white/40 rounded text-white notranslate"
          placeholder="Page"
        />
        <button
          onClick={handleGoToPage}
          disabled={!goToPage || isLoading}
          className="cyberpunk-neon2-btn"
          style={{
            padding: '4px 8px',
          }}
        >
         <span className="text">Go</span> 
        </button>
      </div>
    </div>
  );
}
