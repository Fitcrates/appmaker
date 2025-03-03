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
        className="fixed max-h-full mt-12 inset-4 md:inset-8 flex items-center justify-center overflow-auto"
        style={{ 
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <div className=" rounded-lg shadow-xl w-full max-w-4xl max-h-full overflow-y-auto backgroundMain ring-1 ring-white/40">
        <div className="sticky top-0 backgroundMain ">
          <div className=" flex items-center justify-between p-4 border-b">
            
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-4  hover:bg-red-300 rounded-full text-white hover:text-black transition-colors relative"
            >
              <X className="w-6 h-6" />
            </button>
            </div>
          </div>
          <div className="overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
