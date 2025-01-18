import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100]"
      style={{ 
        contain: 'strict',
        willChange: 'transform' 
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80" 
        onClick={onClose}
        style={{ 
          willChange: 'opacity',
          backfaceVisibility: 'hidden'
        }}
      />
      
      {/* Modal Content */}
      <div 
        className="fixed inset-4 md:inset-8 flex items-center justify-center"
        style={{ 
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <div 
          className="bg-white w-full h-[90vh] rounded-lg shadow-xl flex flex-col overflow-hidden"
          style={{ 
            contain: 'content',
            willChange: 'transform',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div 
            className="flex-1 overflow-hidden"
            style={{ 
              contain: 'content',
              willChange: 'transform',
              backfaceVisibility: 'hidden'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
