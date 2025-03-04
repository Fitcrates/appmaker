/**
 * Utility for fetching data from the Netlify serverless cache function
 * This helps reduce API calls to Jikan API by using our server-side cache
 */

import { RequestPriority } from './api';

const NETLIFY_CACHE_URL = '/.netlify/functions/cache';

/**
 * Fetch data from the server cache
 * @param endpoint The Jikan API endpoint (e.g., '/top/anime')
 * @param params Additional parameters for the request
 * @returns The API response data
 */
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
  '/anime'  // Add this endpoint for GenrePage
];

/**
 * Check if an endpoint should use server-side caching
 */
export const shouldUseServerCache = (endpoint: string, params?: Record<string, string | number | boolean>): boolean => {
  // Skip cache if bypass_cache is true
  if (params && params.bypass_cache) {
    console.log('Bypassing server cache due to bypass_cache parameter');
    return false;
  }
  
  // Skip cache for search queries
  if (params && 'q' in params) {
    console.log('Bypassing server cache due to search query');
    return false;
  }
  
  return CACHEABLE_ENDPOINTS.some(cacheable => endpoint.startsWith(cacheable));
};
