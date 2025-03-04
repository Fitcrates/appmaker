import React, { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

export const statusOptions = [
  { id: 'planning', label: 'Planning to Watch' },
  { id: 'watching', label: 'Currently Watching' },
  { id: 'completed', label: 'Completed' },
  { id: 'dropped', label: 'Dropped' }
] as const;

interface StatusFilterProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatuses,
  onStatusChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const toggleStatus = (statusId: string) => {
    const newStatuses = selectedStatuses.includes(statusId)
      ? selectedStatuses.filter(s => s !== statusId)
      : [...selectedStatuses, statusId];
    onStatusChange(newStatuses);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center  px-4 py-2  ring-1 ring-white/40 text-white rounded-lg gap-2 hover:shadow-lg hover:shadow-[#fa448c]/50"
      >
        <span>Status</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 bg-white border rounded-lg shadow-lg">
          {statusOptions.map(status => (
            <label
              key={status.id}
              className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedStatuses.includes(status.id)}
                onChange={() => toggleStatus(status.id)}
                className="mr-2"
              />
              {status.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
