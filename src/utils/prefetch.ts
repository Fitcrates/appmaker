import { lazy } from 'react';

/**
 * Prefetches the AnimeToWatch component when hovering over its link
 */
export const prefetchAnimeToWatch = (): void => {
  // Using dynamic import to prefetch the component
  import('../components/AnimeToWatch')
    .then(() => {
      console.log('AnimeToWatch component prefetched successfully');
    })
    .catch(error => {
      console.error('Error prefetching AnimeToWatch component:', error);
    });
};

/**
 * Prefetches the UserRating component when hovering over its link
 */
export const prefetchUserRating = (): void => {
  // Using dynamic import to prefetch the component
  import('../components/UserRating')
    .then(() => {
      console.log('UserRating component prefetched successfully');
    })
    .catch(error => {
      console.error('Error prefetching UserRating component:', error);
    });
};
