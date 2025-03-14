import { X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useState } from 'react';

interface CloseButtonProps {
  animeId: number;
  onDelete: () => void;
}

export function CloseButton({ animeId, onDelete }: CloseButtonProps) {
  const { supabase } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!supabase || isDeleting) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('anime_watchlist')
        .delete()
        .eq('id', animeId);

      if (error) throw error;
      onDelete();
    } catch (error) {
      console.error('Error deleting anime:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="absolute top-3 right-3 p-2 bg-red-500/50 hover:bg-red-500/90 transform duration-200 scale-100 hover:scale-110 rounded-full text-white transition-colors"
      title="Remove from watchlist"
    >
      <X size={16} className={isDeleting ? 'opacity-50' : ''} />
    </button>
  );
}
