const API_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Request queue to handle rate limiting
class RequestQueue {
  private static instance: RequestQueue;
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;

  private constructor() {}

  static getInstance(): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeToWait = Math.max(0, RATE_LIMIT_DELAY - (now - this.lastRequestTime));
      
      if (timeToWait > 0) {
        await delay(timeToWait);
      }

      const request = this.queue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Error processing request:', error);
        }
        this.lastRequestTime = Date.now();
      }
    }
    this.processing = false;
  }
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // Cache durations in milliseconds
  private static readonly CACHE_DURATIONS = {
    ANIME_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
    TOP_ANIME: 12 * 60 * 60 * 1000,     // 12 hours
    SCHEDULES: 30 * 60 * 1000,          // 30 minutes
    SEASONS: 6 * 60 * 60 * 1000,        // 6 hours
    RANDOM: 0,                          // No cache for random
    DEFAULT: 5 * 60 * 1000              // 5 minutes default
  };

  set<T>(key: string, data: T): void {
    const duration = this.getCacheDuration(key);
    if (duration === 0) return; // Don't cache if duration is 0
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const duration = this.getCacheDuration(key);
    if (duration === 0) return null; // Don't use cache if duration is 0
    
    if (Date.now() - entry.timestamp > duration) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private getCacheDuration(key: string): number {
    if (key.startsWith('/anime/') && !key.includes('random')) {
      return APICache.CACHE_DURATIONS.ANIME_DETAILS;
    }
    if (key.startsWith('/top/anime')) {
      return APICache.CACHE_DURATIONS.TOP_ANIME;
    }
    if (key.startsWith('/schedules')) {
      return APICache.CACHE_DURATIONS.SCHEDULES;
    }
    if (key.startsWith('/seasons')) {
      return APICache.CACHE_DURATIONS.SEASONS;
    }
    if (key.includes('random')) {
      return APICache.CACHE_DURATIONS.RANDOM;
    }
    return APICache.CACHE_DURATIONS.DEFAULT;
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new APICache();
const requestQueue = RequestQueue.getInstance();
const pendingRequests = new Map<string, Promise<any>>();

// Cache configuration
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const CACHE_SIZE_LIMIT = 100; // Maximum number of cached items

interface Cache<T> {
  [key: string]: CacheEntry<T>;
}

// Initialize caches
const animeCache: Cache<any> = {};
const genreCache: Cache<any> = {};

// Helper function to clean old cache entries
const cleanCache = <T>(cache: Cache<T>) => {
  const now = Date.now();
  Object.keys(cache).forEach(key => {
    if (now - cache[key].timestamp > CACHE_DURATION) {
      delete cache[key];
    }
  });
};

// Helper function to ensure cache doesn't exceed size limit
const limitCacheSize = <T>(cache: Cache<T>) => {
  const entries = Object.entries(cache);
  if (entries.length > CACHE_SIZE_LIMIT) {
    // Sort by timestamp and remove oldest entries
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    entries.slice(CACHE_SIZE_LIMIT).forEach(([key]) => {
      delete cache[key];
    });
  }
};

export const fetchFromAPI = async <T>(endpoint: string, params?: Record<string, string | number | boolean>, priority: RequestPriority = RequestPriority.MEDIUM): Promise<T> => {
  const queryString = params
    ? '?' + new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()
    : '';
  
  const fullEndpoint = `${endpoint}${queryString}`;
  
  // Check cache first
  const cachedData = apiCache.get<T>(fullEndpoint);
  if (cachedData) {
    // console.log('Cache hit for', fullEndpoint);
    return cachedData;
  }

  // If this is an individual anime fetch, check if it's already being fetched
  if (endpoint.startsWith('/anime/') && !endpoint.includes('?') && !endpoint.includes('/characters') && !endpoint.includes('/reviews') && !endpoint.includes('/recommendations')) {
    const animeId = endpoint.split('/')[2];
    const pendingKey = `pending_${animeId}`;
    const pendingPromise = pendingRequests.get(pendingKey);
    if (pendingPromise) {
      return pendingPromise as Promise<T>;
    }

    // Create a new promise for this request
    const promise = requestQueue.add(async () => {
      try {
        console.log('Fetching from', `${API_BASE_URL}${fullEndpoint}`);
        const response = await fetch(`${API_BASE_URL}${fullEndpoint}`);

        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limit hit, waiting 3 seconds...');
            await delay(3000);
            return fetchFromAPI(endpoint, params, priority);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data for anime:', data);
        apiCache.set(fullEndpoint, data);
        pendingRequests.delete(pendingKey);
        return data;
      } catch (error) {
        console.error('Error fetching anime:', error);
        pendingRequests.delete(pendingKey);
        throw error;
      }
    });

    pendingRequests.set(pendingKey, promise);
    return promise;
  }

  // Queue the request
  return requestQueue.add(async () => {
    try {
      console.log('Fetching from', `${API_BASE_URL}${fullEndpoint}`);
      const response = await fetch(`${API_BASE_URL}${fullEndpoint}`);

      if (!response.ok) {
        if (response.status === 429) {
          await delay(3000);
          return fetchFromAPI(endpoint, params, priority);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      apiCache.set(fullEndpoint, data);
      return data;
    } catch (error) {
      throw error;
    }
  });
};

export const fetchAnimeData = async (id: number): Promise<any> => {
  const cacheKey = `anime-${id}`;
  const now = Date.now();

  // Check cache first
  if (animeCache[cacheKey] && now - animeCache[cacheKey].timestamp < CACHE_DURATION) {
    console.log('Using cached anime data for:', id);
    return animeCache[cacheKey].data;
  }

  // Clean cache periodically
  cleanCache(animeCache);

  // Add to request queue with high priority
  const response = await requestQueue.add(async () => {
    try {
      console.log('Fetching from', `https://api.jikan.moe/v4/anime/${id}`);
      const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { data } = await response.json();
      console.log('Received data for anime:', { data });

      // Cache the result
      animeCache[cacheKey] = {
        data,
        timestamp: now
      };

      // Ensure cache doesn't grow too large
      limitCacheSize(animeCache);

      return data;
    } catch (error) {
      console.error('Error fetching anime:', error);
      throw error;
    }
  });

  return response;
};

export const fetchAnimeGenres = async (): Promise<any> => {
  const cacheKey = 'anime-genres';
  const now = Date.now();

  // Check cache first
  if (genreCache[cacheKey] && now - genreCache[cacheKey].timestamp < CACHE_DURATION) {
    console.log('Using cached genre data');
    return genreCache[cacheKey].data;
  }

  // Clean cache periodically
  cleanCache(genreCache);

  // Add to request queue with medium priority
  const response = await requestQueue.add(async () => {
    try {
      console.log('Fetching from', 'https://api.jikan.moe/v4/genres/anime');
      const response = await fetch('https://api.jikan.moe/v4/genres/anime');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { data } = await response.json();

      // Cache the result
      genreCache[cacheKey] = {
        data,
        timestamp: now
      };

      return data;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  });

  return response;
};

// Utility function to delay loading of components
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

enum RequestPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2,
}

export { RequestPriority, delay };
