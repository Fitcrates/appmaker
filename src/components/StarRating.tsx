import { useState, useEffect } from 'react';

interface StarRatingProps {
  initialRating?: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ initialRating = 0, onRatingChange, disabled = false }: StarRatingProps) {
  const [rating, setRating] = useState<number>(Number(initialRating) || 0);
  const [hover, setHover] = useState<number | null>(null);

  // Sync with parent's initialRating
  useEffect(() => {
    setRating(Number(initialRating) || 0);
  }, [initialRating]);

  const handleMouseEnter = (value: number) => {
    if (!disabled) {
      setHover(value);
    }
  };

  const handleMouseLeave = () => {
    setHover(null);
  };

  const handleClick = (value: number) => {
    if (!disabled) {
      setRating(value);
      onRatingChange(value);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 10 }, (_, index) => {
      const value = index + 1;
      const displayValue = hover !== null ? hover : rating;
      const filled = displayValue >= value;

      return (
        <button
          key={value}
          type="button"
          className={`text-xl ${
            filled
              ? 'text-yellow-400 hover:text-yellow-500'
              : 'text-gray-300 hover:text-gray-400'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          onMouseEnter={() => handleMouseEnter(value)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(value)}
          disabled={disabled}
          aria-label={`Rate ${value} out of 10`}
        >
          ★
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex">
        {renderStars()}
      </div>
      <div className="text-sm text-white">
        {hover !== null || rating > 0 ? `${(hover || rating).toString()}/10` : 'Rate this anime'}
      </div>
    </div>
  );
}
