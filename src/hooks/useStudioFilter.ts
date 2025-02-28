import { useState, useCallback, useEffect } from 'react';
import { fetchFromAPI } from '../utils/api';
import { majorStudios } from '../components/ui/Filters/constants';

export interface Studio {
  mal_id: number;
  name: string;
  type: string;
  url: string;
}

export const useStudioFilter = () => {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudios, setSelectedStudios] = useState<Studio[]>([]);
  const [studioSearchTerm, setStudioSearchTerm] = useState('');
  const [isStudioDropdownOpen, setIsStudioDropdownOpen] = useState(false);
  const [isStudiosLoading, setIsStudiosLoading] = useState(false);

  const fetchStudios = useCallback(async (searchTerm: string = '') => {
    if (isStudiosLoading) return;
    
    setIsStudiosLoading(true);
    try {
      // Always start with the predefined list
      const baseStudios = majorStudios.map(s => ({
        mal_id: s.id,
        name: s.name,
        type: "anime",
        url: `https://myanimelist.net/anime/producer/${s.id}`
      }));

      if (!searchTerm) {
        setStudios(baseStudios);
        setIsStudiosLoading(false);
        return;
      }

      // Filter the predefined list first
      const searchTermLower = searchTerm.toLowerCase();
      const filteredStudios = baseStudios.filter(studio => 
        studio.name.toLowerCase().includes(searchTermLower)
      );

      // Only make an API call if we don't have enough local matches
      // and the search term is at least 3 characters long
      if (filteredStudios.length < 5 && searchTerm.length >= 3) {
        try {
          const response = await fetchFromAPI<any>('/producers/search', {
            q: searchTerm,
            limit: 10,
            order_by: 'count',
            sort: 'desc'
          });
          
          if (response?.data) {
            const apiResults = response.data.map((studio: any) => ({
              mal_id: studio.mal_id,
              name: studio.titles?.[0]?.title || studio.name,
              type: "anime",
              url: studio.url
            }));
            setStudios([...baseStudios, ...apiResults]);
          }
        } catch (err) {
          console.error('Error fetching studios from API:', err);
          // If API fails, still show local results
          setStudios(filteredStudios);
        }
      } else {
        // If we have enough local matches or search term is too short, just use those
        setStudios(filteredStudios);
      }
    } catch (err) {
      console.error('Error in fetchStudios:', err);
      // Reset to predefined list on error
      setStudios(majorStudios.map(s => ({
        mal_id: s.id,
        name: s.name,
        type: "anime",
        url: `https://myanimelist.net/anime/producer/${s.id}`
      })));
    } finally {
      setIsStudiosLoading(false);
    }
  }, [isStudiosLoading]);

  // Debounced studio search with longer delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studioSearchTerm !== '') {
        fetchStudios(studioSearchTerm);
      } else {
        // If search term is empty, just show the predefined list
        const baseStudios = majorStudios.map(s => ({
          mal_id: s.id,
          name: s.name,
          type: "anime",
          url: `https://myanimelist.net/anime/producer/${s.id}`
        }));
        setStudios(baseStudios);
      }
    }, 800); // Increased debounce time

    return () => clearTimeout(timer);
  }, [studioSearchTerm, fetchStudios]);

  const handleStudioSelect = useCallback((studio: Studio) => {
    setSelectedStudios(prev => {
      const isSelected = prev.some(s => s.mal_id === studio.mal_id);
      if (isSelected) {
        return prev.filter(s => s.mal_id !== studio.mal_id);
      } else {
        return [...prev, studio];
      }
    });
  }, []);

  const clearStudios = useCallback(() => {
    setSelectedStudios([]);
  }, []);

  return {
    studios,
    selectedStudios,
    studioSearchTerm,
    setStudioSearchTerm,
    isStudioDropdownOpen,
    setIsStudioDropdownOpen,
    isStudiosLoading,
    handleStudioSelect,
    clearStudios
  };
};
