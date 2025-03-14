import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../context/AuthContext';
import { ChevronDown } from 'lucide-react';

interface StatusDropdownProps {
  animeId: number;
  currentStatus: string;
  onStatusChange: (status: string) => void;
  className?: string;
}

const statusOptions = [
  { value: 'planning', label: 'Plan to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' }
];

export function StatusDropdown({ animeId, currentStatus, onStatusChange, className }: StatusDropdownProps) {
  const { supabase } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.status-dropdown-menu')
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      if (!supabase) throw new Error('Supabase instance is not available');
      const { error } = await supabase
        .from('anime_watchlist')
        .update({ status: newStatus })
        .eq('id', animeId);

      if (error) throw error;
      onStatusChange(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const currentLabel = statusOptions.find(option => option.value === currentStatus)?.label || 'Select Status';

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex items-center bottom-0 gap-1 px-2 py-1 text-sm ring-1 ring-white/20  
          bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] text-white rounded-lg  w-full ${className}`}
      >
        <span className={isUpdating ? 'opacity-50' : ''}>{currentLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${isUpdating ? 'opacity-51' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          className="status-dropdown-menu fixed backgroundMain ring-1 ring-white/40  text-white rounded-md shadow-lg"
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={isUpdating}
              className={`w-full text-left px-3 py-2 text-white text-sm bg-clip-text hover:text-[#4ef1d6] hover:drop-shadow-[0_0_8px_#4ef1d6] 
                ${currentStatus === option.value ? 'bg-[#EC4899]/80 text-white ' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
