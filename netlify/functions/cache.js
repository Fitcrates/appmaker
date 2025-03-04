const axios = require('axios');

// Separate caches for different endpoints
const cache = {
  topAnime: { data: null, lastUpdated: 0 },
  topMovies: { data: null, lastUpdated: 0 },
  currentSeason: { data: null, lastUpdated: 0 },
  schedules: {}, // Will store different days as keys
  anime: {}, // Will store different parameter combinations as keys
  lastApiCall: 0
};

// Cache durations for different endpoints
const CACHE_DURATIONS = {
  '/top/anime': 6 * 60 * 60 * 1000, // 6 hours for top anime
  '/top/anime/movie': 12 * 60 * 60 * 1000, // 12 hours for top movies
  '/seasons/now': 3 * 60 * 60 * 1000, // 3 hours for current season
  '/schedules': 30 * 60 * 1000, // 30 minutes for schedules
  '/anime': 6 * 60 * 60 * 1000 // 6 hours for general anime listings
};

const API_RATE_LIMIT = 1000; // 1 second between API calls

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRateLimit = async (url, params = {}) => {
  const now = Date.now();
  const timeToWait = Math.max(0, cache.lastApiCall + API_RATE_LIMIT - now);
  
  if (timeToWait > 0) {
    console.log(`Rate limit hit, waiting ${timeToWait}ms before next request`);
    await sleep(timeToWait);
  }

  cache.lastApiCall = Date.now();
  console.log(`Fetching from API: ${url}`);
  
  try {
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
      console.log('Rate limit exceeded, retrying after delay');
      await sleep(2000); // Wait 2 seconds before retry
      return fetchWithRateLimit(url, params);
    }
    throw error;
  }
};

// Get cache key based on endpoint and parameters
const getCacheKey = (endpoint, params = {}) => {
  // Special case for top movies
  if (endpoint === '/top/anime' && params.type === 'movie') {
    return '/top/anime/movie';
  }
  
  // Special case for schedules with different days
  if (endpoint === '/schedules' && params.filter) {
    return `${endpoint}/${params.filter}`;
  }
  
  // Special case for anime with specific parameters
  if (endpoint === '/anime') {
    // If there's a search query or specific filters, don't cache
    if (params.q || params.timestamp) {
      return null; // Skip caching for search queries
    }
    
    // Create a cache key based on common filter parameters
    const filterParams = [];
    if (params.order_by) filterParams.push(`order_by=${params.order_by}`);
    if (params.sort) filterParams.push(`sort=${params.sort}`);
    if (params.sfw) filterParams.push('sfw=true');
    if (params.type) filterParams.push(`type=${params.type}`);
    
    if (filterParams.length > 0) {
      return `${endpoint}?${filterParams.join('&')}`;
    }
  }
  
  return endpoint;
};

// Get cache duration based on endpoint
const getCacheDuration = (endpoint) => {
  if (endpoint.startsWith('/top/anime')) {
    if (endpoint.includes('movie')) {
      return CACHE_DURATIONS['/top/anime/movie'];
    }
    return CACHE_DURATIONS['/top/anime'];
  }
  if (endpoint.startsWith('/seasons/now')) {
    return CACHE_DURATIONS['/seasons/now'];
  }
  if (endpoint.startsWith('/schedules')) {
    return CACHE_DURATIONS['/schedules'];
  }
  if (endpoint.startsWith('/anime')) {
    return CACHE_DURATIONS['/anime'];
  }
  return CACHE_DURATIONS['/top/anime']; // Default
};

const fetchEndpoint = async (endpoint, params = {}) => {
  const cacheKey = getCacheKey(endpoint, params);
  
  if (cacheKey === null) {
    console.log(`Cache miss for ${endpoint}, fetching fresh data`);
    const response = await fetchWithRateLimit(`https://api.jikan.moe/v4${endpoint}`, params);
    return response.data;
  }

  const now = Date.now();
  const cacheDuration = getCacheDuration(endpoint);
  
  // Check if we have a valid cache entry
  if (cacheKey.startsWith('/schedules/')) {
    const day = cacheKey.split('/')[2];
    if (cache.schedules[day]?.data && cache.schedules[day].lastUpdated + cacheDuration > now) {
      console.log(`Cache hit for ${cacheKey}`);
      return cache.schedules[day].data;
    }
  } else if (cacheKey.startsWith('/anime?')) {
    const cacheKeySimple = cacheKey.replace('/anime?', '');
    if (cache.anime[cacheKeySimple]?.data && cache.anime[cacheKeySimple].lastUpdated + cacheDuration > now) {
      console.log(`Cache hit for ${cacheKey}`);
      return cache.anime[cacheKeySimple].data;
    }
  } else if (cacheKey === '/top/anime') {
    if (cache.topAnime?.data && cache.topAnime.lastUpdated + cacheDuration > now) {
      console.log(`Cache hit for ${cacheKey}`);
      return cache.topAnime.data;
    }
  } else if (cacheKey === '/top/anime/movie') {
    if (cache.topMovies?.data && cache.topMovies.lastUpdated + cacheDuration > now) {
      console.log(`Cache hit for ${cacheKey}`);
      return cache.topMovies.data;
    }
  } else if (cacheKey === '/seasons/now') {
    if (cache.currentSeason?.data && cache.currentSeason.lastUpdated + cacheDuration > now) {
      console.log(`Cache hit for ${cacheKey}`);
      return cache.currentSeason.data;
    }
  }
  
  // If we get here, we need to fetch fresh data
  console.log(`Cache miss for ${cacheKey}, fetching fresh data`);
  const response = await fetchWithRateLimit(`https://api.jikan.moe/v4${endpoint}`, params);
  
  // Store in cache
  if (cacheKey.startsWith('/schedules/')) {
    const day = cacheKey.split('/')[2];
    cache.schedules[day] = { data: response.data, lastUpdated: now };
  } else if (cacheKey.startsWith('/anime?')) {
    const cacheKeySimple = cacheKey.replace('/anime?', '');
    cache.anime[cacheKeySimple] = { data: response.data, lastUpdated: now };
  } else if (cacheKey === '/top/anime') {
    cache.topAnime = { data: response.data, lastUpdated: now };
  } else if (cacheKey === '/top/anime/movie') {
    cache.topMovies = { data: response.data, lastUpdated: now };
  } else if (cacheKey === '/seasons/now') {
    cache.currentSeason = { data: response.data, lastUpdated: now };
  }
  
  return response.data;
};

exports.handler = async (event) => {
  console.log('Cache function called with params:', event.queryStringParameters);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { endpoint, page = '1', limit = '10', filter, type, sfw } = event.queryStringParameters || {};
    
    if (!endpoint) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({ error: 'Endpoint parameter is required' })
      };
    }

    const params = { page, limit };
    if (filter) params.filter = filter;
    if (type) params.type = type;
    if (sfw) params.sfw = sfw;

    const data = await fetchEndpoint(endpoint, params);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in cache function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({
        error: 'Failed to fetch data',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
