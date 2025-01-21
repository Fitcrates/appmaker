import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export function Pagination({ currentPage, totalPages, onPageChange, isLoading }: PaginationProps) {
  const [goToPage, setGoToPage] = useState('');

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
    setGoToPage('');
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="text-gray-900 hover:bg-gray-700 disabled:opacity-50"
      >
        <ChevronLeft />
      </button>

      {/* First Page Button */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || isLoading}
        className="px-2 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
      >
        1
      </button>

      {/* Current Page Button */}
      <span
        className="px-2 rounded-full bg-purple-600 text-white"
      >
        {currentPage}
      </span>

      {/* Last Page Button */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || isLoading}
        className="px-2 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
      >
        {totalPages}
      </button>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="text-gray-900 hover:bg-gray-700 disabled:opacity-50"
      >
        <ChevronRight />
      </button>

      {/* Go-to-Page Input */}
      <div className="flex items-center px-2 space-x-2">
        <input
          type="number"
          value={goToPage}
          onChange={(e) => setGoToPage(e.target.value)}
          placeholder="Page"
          className="w-16 py-1 text-center text-gray-300 bg-gray-900 rounded-full"
        />
        <button
          onClick={handleGoToPage}
          disabled={isLoading || !goToPage}
          className="px-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 disabled:opacity-50"
        >
          Go
        </button>
      </div>
    </div>
  );
}
