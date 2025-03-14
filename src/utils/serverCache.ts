import { RequestPriority } from './api';

const NETLIFY_CACHE_URL = '/.netlify/functions/cache';

export const fetchFromServerCache = async <T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> => {
  try {
    // Add the endpoint to the params
    const queryParams = new URLSearchParams({
      endpoint,
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      )
    });

    const url = `${NETLIFY_CACHE_URL}?${queryParams.toString()}`;
    console.log('Fetching from server cache:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Server cache error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from server cache:', error);
    throw error;
  }
};

/**
 * Endpoints that should use server-side caching
 */
export const CACHEABLE_ENDPOINTS = [
  '/top/anime',
  '/seasons/now',
  '/schedules',
  '/anime',
  '/anime/',  // Add this to catch all anime-related endpoints
  '/characters',
  '/episodes',
  '/recommendations',
  '/reviews'
];

/**
 * Check if an endpoint should use server-side caching
 */
export const shouldUseServerCache = (endpoint: string, params?: Record<string, string | number | boolean>): boolean => {
  // Skip cache if bypass_cache is true
  if (params && params.bypass_cache) {
    return false;
  }
  
  // Skip cache for search queries
  if (params && 'q' in params) {
    return false;
  }
  
  // Allow caching for all pages of anime details and related data
  if (endpoint.startsWith('/anime/') && !endpoint.includes('random')) {
    return true;
  }
  
  // For other endpoints, skip cache for pagination beyond page 1
  if (params && params.page && Number(params.page) > 1) {
    return false;
  }
  
  return CACHEABLE_ENDPOINTS.some(cacheable => endpoint.startsWith(cacheable));
};
