const axios = require('axios');

// Cache configuration
const CACHE = new Map();
const MAX_CACHE_SIZE = 500; // Increased for better hit rate
const BATCH_SIZE = 3; // Number of concurrent requests

// Cache durations in milliseconds
const CACHE_DURATIONS = {
  ANIME_DETAILS: 24 * 60 * 60 * 1000,  // 24 hours for anime details
  RELATED_DATA: 12 * 60 * 60 * 1000,   // 12 hours for reviews, recommendations, etc.
  TOP_ANIME: 6 * 60 * 60 * 1000,       // 6 hours for top anime
  SCHEDULES: 15 * 60 * 1000,           // 15 minutes for schedules
  SEASONS: 3 * 60 * 60 * 1000,         // 3 hours for seasons
  RANDOM: 0,                           // No cache for random
  DEFAULT: 5 * 60 * 1000               // 5 minutes default
};

// Rate limiting configuration
const RATE_LIMIT = {
  delay: 50,                          // 50ms between requests in a batch
  batchDelay: 1000,                   // 1 second between batches
  lastRequest: 0,
  lastBatch: 0,
  retryDelay: 2000                    // 2 seconds retry delay for 429 errors
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
    // Higher cache duration for anime details
    if (endpoint.split('/').length === 3) {
      return CACHE_DURATIONS.ANIME_DETAILS;
    }
    // Related data (reviews, recommendations, etc.)
    return CACHE_DURATIONS.RELATED_DATA;
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

// Fetch data with optimized rate limiting
const fetchWithRateLimit = async (url, params = {}) => {
  const now = Date.now();
  const timeSinceLastBatch = now - RATE_LIMIT.lastBatch;
  const timeSinceLastRequest = now - RATE_LIMIT.lastRequest;

  // Check if we need to wait for the batch delay
  if (timeSinceLastBatch < RATE_LIMIT.batchDelay) {
    await delay(RATE_LIMIT.batchDelay - timeSinceLastBatch);
    RATE_LIMIT.lastBatch = Date.now();
  }

  // Check if we need to wait for the request delay
  if (timeSinceLastRequest < RATE_LIMIT.delay) {
    await delay(RATE_LIMIT.delay - timeSinceLastRequest);
  }

  try {
    RATE_LIMIT.lastRequest = Date.now();
    const response = await axios.get(url, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
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
      return cached.data;
    }
  }

  // Fetch fresh data
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

// Lambda handler with optimized response
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

    // Set appropriate cache control headers
    const cacheDuration = Math.floor(getCacheDuration(endpoint) / 1000);
    
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheDuration}`,
        'Vary': 'Accept-Encoding'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in cache function:', error);

    return {
      statusCode: error.response?.status || 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};
