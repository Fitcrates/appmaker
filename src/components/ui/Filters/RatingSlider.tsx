import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';

interface RatingSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
}

export function RatingSlider({ value, onValueChange }: RatingSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleValueChange = (newValue: number[]) => {
    const typedValue: [number, number] = [newValue[0], newValue[1]];
    setLocalValue(typedValue);
    onValueChange(typedValue);
  };

  return (
    <div className="w-full max-w-xs p-8 rounded-lg shadow-sm">
      <div className="flex text-white justify-between text-sm  mb-2">
        <span>Rating: {localValue[0].toFixed(1)}</span>
        <span>to {localValue[1].toFixed(1)}</span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full "
        value={localValue}
        onValueChange={handleValueChange}
        min={1}
        max={10}
        step={0.1}
        minStepsBetweenThumbs={1}
      >
        <Slider.Track className="relative grow rounded-full h-2">
          <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 bg-white shadow-lg rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Minimum rating"
        />
        <Slider.Thumb
          className="block w-5 h-5 bg-white shadow-lg rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Maximum rating"
        />
      </Slider.Root>
    </div>
  );
}
