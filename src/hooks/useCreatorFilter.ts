import { useState, useCallback, useEffect } from 'react';
import { fetchFromAPI } from '../utils/api';
import { notableCreators } from '../components/ui/Filters/constants';
import { useAnimeStore } from '../store/animeStore';

export interface Creator {
  mal_id: number;
  name: string;
  about?: string;
  url: string;
}

export const useCreatorFilter = () => {
  const { selectedCreators, setSelectedCreators } = useAnimeStore();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorSearchTerm, setCreatorSearchTerm] = useState('');
  const [isCreatorDropdownOpen, setIsCreatorDropdownOpen] = useState(false);
  const [isCreatorsLoading, setIsCreatorsLoading] = useState(false);

  const fetchCreators = useCallback(async (searchTerm: string = '') => {
    if (isCreatorsLoading) return;
    
    setIsCreatorsLoading(true);
    try {
      // Always start with the predefined list
      const baseCreators = notableCreators.map(c => ({
        mal_id: c.id,
        name: c.name,
        about: c.about,
        url: `https://myanimelist.net/people/${c.id}`
      }));

      if (!searchTerm) {
        setCreators(baseCreators);
        return;
      }

      // Filter the predefined list first
      const searchTermLower = searchTerm.toLowerCase();
      const filteredCreators = baseCreators.filter(creator => 
        creator.name.toLowerCase().includes(searchTermLower)
      );

      // If we have matches in our predefined list, use those
      if (filteredCreators.length > 0) {
        setCreators(filteredCreators);
      } else {
        // Otherwise, search the API
        const response = await fetchFromAPI<any>('/people', {
          q: searchTerm,
          limit: 10,
          order_by: 'favorites',
          sort: 'desc'
        });
        
        if (response?.data) {
          const searchResults = response.data.map((person: any) => ({
            mal_id: person.mal_id,
            name: person.name,
            about: person.about || `Known for: ${person.favorites} favorites`,
            url: person.url
          }));
          setCreators(searchResults);
        }
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
      // On error, show the predefined list filtered by search term
      const filteredCreators = notableCreators
        .filter(c => c.name.toLowerCase().includes(creatorSearchTerm.toLowerCase()))
        .map(c => ({
          mal_id: c.id,
          name: c.name,
          about: c.about,
          url: `https://myanimelist.net/people/${c.id}`
        }));
      setCreators(filteredCreators);
    } finally {
      setIsCreatorsLoading(false);
    }
  }, [isCreatorsLoading, creatorSearchTerm]);

  // Debounced creator search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCreators(creatorSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [creatorSearchTerm, fetchCreators]);

  const handleCreatorSelect = useCallback((creator: Creator) => {
    const newSelectedCreators = [...selectedCreators];
    const existingIndex = newSelectedCreators.findIndex(c => c.mal_id === creator.mal_id);
    
    if (existingIndex !== -1) {
      newSelectedCreators.splice(existingIndex, 1);
    } else {
      newSelectedCreators.push(creator);
    }
    
    setSelectedCreators(newSelectedCreators);
  }, [selectedCreators, setSelectedCreators]);

  const clearCreators = useCallback(() => {
    setSelectedCreators([]);
  }, [setSelectedCreators]);

  return {
    creators,
    selectedCreators,
    creatorSearchTerm,
    setCreatorSearchTerm,
    isCreatorDropdownOpen,
    setIsCreatorDropdownOpen,
    isCreatorsLoading,
    handleCreatorSelect,
    clearCreators
  };
};
