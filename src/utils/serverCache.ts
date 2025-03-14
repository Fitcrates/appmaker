/**
 * Server cache utility functions
 */

// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  /**
   * Cache duration for anime details
   */
  ANIME_DETAILS: 24 * 60 * 60 * 1000,  // 24 hours
  /**
   * Cache duration for related data
   */
  RELATED_DATA: 12 * 60 * 60 * 1000,   // 12 hours
  /**
   * Cache duration for top anime
   */
  TOP_ANIME: 6 * 60 * 60 * 1000,       // 6 hours
  /**
   * Cache duration for schedules
   */
  SCHEDULES: 15 * 60 * 1000,           // 15 minutes
  /**
   * Cache duration for seasons
   */
  SEASONS: 3 * 60 * 60 * 1000,         // 3 hours
  /**
   * Default cache duration
   */
  DEFAULT: 5 * 60 * 1000               // 5 minutes
};

/**
 * Netlify cache URL
 */
const NETLIFY_CACHE_URL = '/.netlify/functions/cache';

// Track pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Fetches data from the server cache with deduplication and caching
 * @param endpoint The API endpoint to fetch from
 * @param params Optional query parameters
 * @returns Promise with the cached data
 */
export const fetchFromServerCache = async <T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> => {
  try {
    // Generate cache key
    const queryParams = new URLSearchParams({
      endpoint,
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      )
    });
    const cacheKey = `${endpoint}?${queryParams.toString()}`;

    // Check for pending request
    const pendingRequest = pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    const url = `${NETLIFY_CACHE_URL}?${queryParams.toString()}`;
    
    // Create new request
    const request = (async () => {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
          'Access-Control-Allow-Origin': '*' // CORS header
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server cache error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    })();

    // Store pending request
    pendingRequests.set(cacheKey, request);

    // Clean up after request completes
    request.finally(() => {
      pendingRequests.delete(cacheKey);
    });

    return request;
  } catch (error) {
    console.error('Error fetching from server cache:', error);
    throw error;
  }
};

/**
 * List of endpoints that should use server-side caching
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
 * @param endpoint The API endpoint to check
 * @param params Optional query parameters
 * @returns boolean indicating if the endpoint should use caching
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
