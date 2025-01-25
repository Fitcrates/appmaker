import { useState } from 'react';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';

interface StarRatingProps {
  initialRating?: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ initialRating = 0, onRatingChange, disabled = false }: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (disabled) return;
    
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    
    // Calculate if we're on the left or right half of the star
    let value = starIndex;
    if (percent <= 0.5) {
      value -= 0.5;
    }
    
    setHover((value + 1) * 2); // Convert to 1-10 scale
  };

  const handleClick = (starIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    
    let value = starIndex;
    if (percent <= 0.5) {
      value -= 0.5;
    }
    
    const newRating = (value + 1) * 2;
    setRating(newRating);
    onRatingChange(newRating);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHover(0);
  };

  const renderStars = () => {
    const stars = [];
    const currentRating = hover || rating;
    const fullStars = Math.floor(currentRating / 2);
    const hasHalfStar = currentRating % 2 >= 1;

    for (let i = 0; i < 5; i++) {
      const starValue = (i + 1) * 2;
      const isActive = i < fullStars || (i === fullStars && hasHalfStar);
      const isHalfActive = i === fullStars && hasHalfStar;

      stars.push(
        <div
          key={i}
          className={`inline-block ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
          onClick={(e) => handleClick(i, e)}
          onMouseMove={(e) => handleMouseMove(e, i)}
          onMouseLeave={handleMouseLeave}
        >
          {isActive ? (
            isHalfActive ? (
              <FaStarHalfAlt className={`w-8 h-8 ${disabled ? 'text-gray-400' : 'text-yellow-400'}`} />
            ) : (
              <FaStar className={`w-8 h-8 ${disabled ? 'text-gray-400' : 'text-yellow-400'}`} />
            )
          ) : (
            <FaStar className="w-8 h-8 text-gray-300" />
          )}
        </div>
      );
    }

    return stars;
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex space-x-1">
        {renderStars()}
      </div>
      <div className="text-sm text-gray-600">
        {hover || rating ? `${(hover || rating).toFixed(1)}/10` : 'Rate this anime'}
      </div>
    </div>
  );
}
