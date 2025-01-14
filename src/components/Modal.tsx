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
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="fixed inset-0 bg-white/70"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white backdrop-blur rounded-lg w-full max-w-3xl mx-4 h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="h-[calc(85vh-4rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
