import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className = '' }) => {
  const location = useLocation();
  const params = useParams();
  const [animeTitle, setAnimeTitle] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: 'Home', path: '/' }
  ]);

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const pathSegments = location.pathname.split('/').filter(x => x);
      const newBreadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', path: '/' }
      ];
      
      let currentPath = '';
      
      // Handle specific routes
      if (pathSegments[0] === 'anime' && pathSegments.length >= 2) {
        // Add Explore Anime link
        newBreadcrumbs.push({
          label: 'Explore Anime',
          path: '/genres'
        });
        
        // Add Anime Details
        const animeId = pathSegments[1];
        currentPath = `/anime/${animeId}`;
        
        // Fetch anime title if not already fetched
        if (!animeTitle && animeId) {
          try {
            const response = await fetchFromAPI(`/anime/${animeId}`);
            if (response.data) {
              setAnimeTitle(response.data.title);
            }
          } catch (error) {
            console.error('Error fetching anime title:', error);
          }
        }
        
        newBreadcrumbs.push({
          label: animeTitle || 'Anime Details',
          path: currentPath,
          isActive: pathSegments.length === 2
        });
        
        // Handle characters route
        if (pathSegments.length > 2 && pathSegments[2] === 'characters') {
          currentPath = `${currentPath}/characters`;
          newBreadcrumbs.push({
            label: 'Characters',
            path: currentPath,
            isActive: true
          });
        }
      } 
      // Handle character details
      else if (pathSegments[0] === 'character' && pathSegments.length === 2) {
        // Add Explore Anime link
        newBreadcrumbs.push({
          label: 'Explore Anime',
          path: '/genres'
        });
        
        // Get source anime ID from location state
        const sourceAnimeId = location.state?.fromAnimeId;
        
        if (sourceAnimeId) {
          // Add Anime Details link
          const animeDetailPath = `/anime/${sourceAnimeId}`;
          
          // Fetch anime title if not already fetched
          if (!animeTitle && sourceAnimeId) {
            try {
              const response = await fetchFromAPI(`/anime/${sourceAnimeId}`);
              if (response.data) {
                setAnimeTitle(response.data.title);
              }
            } catch (error) {
              console.error('Error fetching anime title:', error);
            }
          }
          
          newBreadcrumbs.push({
            label: animeTitle || 'Anime Details',
            path: animeDetailPath
          });
        }
        
        // Add Character Details
        const characterId = pathSegments[1];
        currentPath = `/character/${characterId}`;
        
        // Fetch character name if not already fetched
        if (!characterName && characterId) {
          try {
            const response = await fetchFromAPI(`/characters/${characterId}`);
            if (response.data) {
              setCharacterName(response.data.name);
            }
          } catch (error) {
            console.error('Error fetching character name:', error);
          }
        }
        
        newBreadcrumbs.push({
          label: characterName || 'Character Details',
          path: currentPath,
          isActive: true
        });
      }
      // Handle genres (Explore Anime)
      else if (pathSegments[0] === 'genres') {
        currentPath = '/genres';
        newBreadcrumbs.push({
          label: 'Explore Anime',
          path: currentPath,
          isActive: true
        });
      }
      // Handle other routes with default behavior
      else {
        for (let i = 0; i < pathSegments.length; i++) {
          const segment = pathSegments[i];
          currentPath += `/${segment}`;
          
          // Format the label
          let label = segment.replace(/-/g, ' ');
          label = label.charAt(0).toUpperCase() + label.slice(1);
          
          newBreadcrumbs.push({
            label,
            path: currentPath,
            isActive: i === pathSegments.length - 1
          });
        }
      }
      
      setBreadcrumbs(newBreadcrumbs);
    };
    
    generateBreadcrumbs();
  }, [location.pathname, animeTitle, characterName, location.state?.fromAnimeId]);
  
  return (
    <nav aria-label="Breadcrumbs" className={`py-3 px-4 ${className}`}>
      <ol className="flex items-center space-x-1 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path + index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-[#4ef1d6]" aria-hidden="true" />
            )}
            
            {breadcrumb.isActive ? (
              <span className="font-medium text-[#4ef1d6]" aria-current="page">
                {breadcrumb.label}
              </span>
            ) : (
              <Link 
                to={breadcrumb.path}
                state={location.state}
                className="text-[#4ef1d6] hover:text-blue-800 hover:underline flex items-center"
              >
                {index === 0 && (
                  <Home className="h-4 w-4 mr-1" aria-hidden="true" />
                )}
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
