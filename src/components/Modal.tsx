import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black opacity-60 backdrop-blur" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="fixed inset-0 sm:inset-4 md:inset-8 flex items-center justify-center">
        <div className="bg-white w-full h-[85%] sm:w-[95%] sm:h-[85%] md:w-4/5 md:h-4/5 rounded-none sm:rounded-lg shadow-xl flex flex-col">
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
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
