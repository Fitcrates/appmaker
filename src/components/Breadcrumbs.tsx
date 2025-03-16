import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { Icons } from '../utils/icons';
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
          path: '/genres#exploreAnime'
        });
        
        // Add Anime Details
        const animeId = pathSegments[1];
        currentPath = `/anime/${animeId}`;
        
        // Fetch anime title if not already fetched
        if (!animeTitle && animeId) {
          try {
            const response = await fetchFromAPI<{data: {title: string}}>(`/anime/${animeId}`);
            if (response.data) {
              setAnimeTitle(response.data.title);
              // Add the anime title breadcrumb with the fetched title
              newBreadcrumbs.push({
                label: response.data.title,
                path: currentPath,
                isActive: pathSegments.length === 2
              });
            } else {
              // Fallback if no data
              newBreadcrumbs.push({
                label: 'Loading...',
                path: currentPath,
                isActive: pathSegments.length === 2
              });
            }
          } catch (error) {
            console.error('Error fetching anime title:', error);
            // Fallback on error
            newBreadcrumbs.push({
              label: 'Loading...',
              path: currentPath,
              isActive: pathSegments.length === 2
            });
          }
        } else {
          // Use cached title if available
          newBreadcrumbs.push({
            label: animeTitle || 'Loading...',
            path: currentPath,
            isActive: pathSegments.length === 2
          });
        }
        
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
          path: '/genres#exploreAnime'
        });
        
        // Get source anime ID from location state
        const sourceAnimeId = location.state?.fromAnimeId;
        
        if (sourceAnimeId) {
          // Add Anime Details link
          const animeDetailPath = `/anime/${sourceAnimeId}`;
          
          // Fetch anime title if not already fetched
          if (!animeTitle && sourceAnimeId) {
            try {
              const response = await fetchFromAPI<{data: {title: string}}>(`/anime/${sourceAnimeId}`);
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
            const response = await fetchFromAPI<{data: {name: string}}>(`/characters/${characterId}`);
            if (response.data) {
              setCharacterName(response.data.name);
              // Add character breadcrumb with fetched name
              newBreadcrumbs.push({
                label: response.data.name,
                path: currentPath,
                isActive: true
              });
            } else {
              // Fallback if no data
              newBreadcrumbs.push({
                label: 'Loading...',
                path: currentPath,
                isActive: true
              });
            }
          } catch (error) {
            console.error('Error fetching character name:', error);
            // Fallback on error
            newBreadcrumbs.push({
              label: 'Loading...',
              path: currentPath,
              isActive: true
            });
          }
        } else {
          // Use cached character name if available
          newBreadcrumbs.push({
            label: characterName || 'Loading...',
            path: currentPath,
            isActive: true
          });
        }
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

  // Helper function to determine if a link should use HashLink
  const isHashLink = (path: string): boolean => {
    return path.includes('#');
  };

  // Smooth scroll function for HashLink
  const scrollWithOffset = (el: HTMLElement) => {
    const yCoordinate = el.getBoundingClientRect().top + window.pageYOffset;
    const yOffset = -80; // Adjust this value based on your header height
    window.scrollTo({ top: yCoordinate + yOffset, behavior: 'smooth' });
  };

  return (
    <nav aria-label="Breadcrumbs" className={`py-3 px-4 ${className}`}>
      <ol className="flex items-center space-x-1 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path} className="flex items-center">
            {index > 0 && (
              <Icons.ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
            )}
            
            {breadcrumb.isActive ? (
              <span className="text-[#ffe921] drop-shadow-[0_0_8px_#ffe921] tilt-neon2">{breadcrumb.label}</span>
            ) : (
              isHashLink(breadcrumb.path) ? (
                <HashLink 
                  to={breadcrumb.path}
                  scroll={scrollWithOffset}
                  className="text-white hover:bg-clip-text hover:text-[#56d8ff] drop-shadow-[0_0_8px_#56d8ff] h transition-colors tilt-neon2"
                >
                  {index === 0 ? (
                    <span className="flex items-center">
                      <Icons.Home className="mr-1 h-4 w-4" />
                      {breadcrumb.label}
                    </span>
                  ) : (
                    breadcrumb.label
                  )}
                </HashLink>
              ) : (
                <Link 
                  to={breadcrumb.path}
                  className="text-white hover:bg-clip-text hover:text-[#56d8ff] drop-shadow-[0_0_8px_#56d8ff] h transition-colors tilt-neon2"
                >
                  {index === 0 ? (
                    <span className="flex items-center">
                      <Icons.Home className="mr-1 h-4 w-4" />
                      {breadcrumb.label}
                    </span>
                  ) : (
                    breadcrumb.label
                  )}
                </Link>
              )
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
