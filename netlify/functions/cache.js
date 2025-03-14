const axios = require('axios');

// Cache configuration
const CACHE = new Map();
const MAX_CACHE_SIZE = 100;

// Cache durations in milliseconds
const CACHE_DURATIONS = {
  ANIME_DETAILS: 24 * 60 * 60 * 1000,  // 24 hours for anime details
  TOP_ANIME: 6 * 60 * 60 * 1000,       // 6 hours for top anime
  SCHEDULES: 15 * 60 * 1000,           // 15 minutes for schedules
  SEASONS: 3 * 60 * 60 * 1000,         // 3 hours for seasons
  RANDOM: 0,                           // No cache for random
  DEFAULT: 5 * 60 * 1000               // 5 minutes default
};

// Rate limiting configuration
const RATE_LIMIT = {
  delay: 1000,                         // 1 second between requests
  lastRequest: 0,
  retryDelay: 2000                     // 2 seconds retry delay for 429 errors
};

// Helper function for controlled delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Clean old cache entries and ensure size limit
const cleanCache = () => {
  if (CACHE.size <= MAX_CACHE_SIZE) return;

  const entries = Array.from(CACHE.entries());
  entries.sort(([, a], [, b]) => b.timestamp - a.timestamp);
  
  // Remove oldest entries to reduce cache to half size
  entries.slice(MAX_CACHE_SIZE / 2).forEach(([key]) => CACHE.delete(key));
};

// Get cache duration based on endpoint
const getCacheDuration = (endpoint) => {
  if (endpoint.startsWith('/anime/') && !endpoint.includes('random')) {
    return CACHE_DURATIONS.ANIME_DETAILS;
  }
  if (endpoint.startsWith('/top/anime')) {
    return CACHE_DURATIONS.TOP_ANIME;
  }
  if (endpoint.startsWith('/schedules')) {
    return CACHE_DURATIONS.SCHEDULES;
  }
  if (endpoint.startsWith('/seasons')) {
    return CACHE_DURATIONS.SEASONS;
  }
  if (endpoint.includes('random')) {
    return CACHE_DURATIONS.RANDOM;
  }
  return CACHE_DURATIONS.DEFAULT;
};

// Generate cache key from endpoint and parameters
const generateCacheKey = (endpoint, params = {}) => {
  // Skip caching for specific cases
  if (params.bypass_cache === 'true' || params.q || endpoint.includes('random')) {
    return null;
  }

  // Create a deterministic cache key
  const sortedParams = Object.entries(params)
    .filter(([key]) => !['bypass_cache', 'q'].includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return sortedParams ? `${endpoint}?${sortedParams}` : endpoint;
};

// Fetch data with rate limiting and retries
const fetchWithRateLimit = async (url, params = {}) => {
  const now = Date.now();
  const timeToWait = Math.max(0, RATE_LIMIT.lastRequest + RATE_LIMIT.delay - now);

  if (timeToWait > 0) {
    await delay(timeToWait);
  }

  try {
    RATE_LIMIT.lastRequest = Date.now();
    const response = await axios.get(url, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    if (error.response?.status === 429) {
      await delay(RATE_LIMIT.retryDelay);
      return fetchWithRateLimit(url, params);
    }
    throw error;
  }
};

// Main fetch function with caching
const fetchFromAPI = async (endpoint, params = {}) => {
  const cacheKey = generateCacheKey(endpoint, params);
  
  // Return cached data if valid
  if (cacheKey) {
    const cached = CACHE.get(cacheKey);
    const cacheDuration = getCacheDuration(endpoint);
    
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached.data;
    }
  }

  // Fetch fresh data
  console.log(`Cache miss for ${endpoint}, fetching fresh data`);
  const response = await fetchWithRateLimit(`https://api.jikan.moe/v4${endpoint}`, params);

  // Cache the response if applicable
  if (cacheKey) {
    CACHE.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    cleanCache();
  }

  return response.data;
};

// Lambda handler
exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const { endpoint, ...queryParams } = params;

    if (!endpoint) {
      throw new Error('Endpoint parameter is required');
    }

    const data = await fetchFromAPI(endpoint, queryParams);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in cache function:', error);

    return {
      statusCode: error.response?.status || 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};
