const axios = require('axios');

// Separate caches for different endpoints
const cache = {
  topAnime: { data: null, lastUpdated: 0 },
  schedules: { data: null, lastUpdated: 0 },
  currentSchedule: { data: null, lastUpdated: 0 },
  lastApiCall: 0
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
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

const fetchEndpoint = async (endpoint, params = {}) => {
  const cacheKey = endpoint.replace('/', '_');
  const now = Date.now();

  // Check if we have valid cached data
  if (cache[cacheKey]?.data && cache[cacheKey].lastUpdated + CACHE_DURATION > now) {
    console.log(`Serving cached data for ${endpoint}`);
    return cache[cacheKey].data;
  }

  console.log(`Cache miss for ${endpoint}, fetching fresh data`);
  const response = await fetchWithRateLimit(`https://api.jikan.moe/v4${endpoint}`, params);
  
  // Update cache
  cache[cacheKey] = {
    data: response.data,
    lastUpdated: now
  };

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
    const { endpoint, page = '1', limit = '10', filter } = event.queryStringParameters || {};
    
    if (!endpoint) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({ error: 'Endpoint parameter is required' })
      };
    }

    const params = { page, limit };
    if (filter) {
      params.filter = filter;
    }

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
