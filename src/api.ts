const API_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Request queue to handle rate limiting
class RequestQueue {
  private static instance: RequestQueue;
  private queue: Array<{ request: () => Promise<any>; priority: RequestPriority }> = [];
  private processing = false;
  private lastRequestTime = 0;

  private constructor() {}

  static getInstance(): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }

  async add<T>(request: () => Promise<T>, priority: RequestPriority): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        request: async () => {
          try {
            const result = await request();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        priority
      });

      // Sort queue by priority
      this.queue.sort((a, b) => a.priority - b.priority);

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

      const item = this.queue.shift();
      if (item) {
        try {
          await item.request();
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
  private static readonly MAX_CACHE_SIZE = 100;
  
  // Cache durations in milliseconds
  private static readonly CACHE_DURATIONS = {
    ANIME_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
    TOP_ANIME: 12 * 60 * 60 * 1000,     // 12 hours
    SCHEDULES: 30 * 60 * 1000,          // 30 minutes
    SEASONS: 6 * 60 * 60 * 1000,        // 6 hours
    RANDOM: 0,                          // No cache for random
    DEFAULT: 60 * 60 * 1000             // 1 hour default
  };

  set<T>(key: string, data: T): void {
    const duration = this.getCacheDuration(key);
    if (duration === 0) return; // Don't cache if duration is 0
    
    // Clear old entries if cache is too large
    if (this.cache.size >= APICache.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
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
    
    return entry.data;
  }

  private getCacheDuration(key: string): number {
    if (key.includes('/anime/')) return APICache.CACHE_DURATIONS.ANIME_DETAILS;
    if (key.includes('/top/anime')) return APICache.CACHE_DURATIONS.TOP_ANIME;
    if (key.includes('/schedules')) return APICache.CACHE_DURATIONS.SCHEDULES;
    if (key.includes('/seasons')) return APICache.CACHE_DURATIONS.SEASONS;
    if (key.includes('/random')) return APICache.CACHE_DURATIONS.RANDOM;
    return APICache.CACHE_DURATIONS.DEFAULT;
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new APICache();
const requestQueue = RequestQueue.getInstance();
const pendingRequests = new Map<string, Promise<any>>();

enum RequestPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2
}

export async function fetchFromAPI<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
  priority: RequestPriority = RequestPriority.MEDIUM
): Promise<T> {
  const queryString = params
    ? '?' + new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString()
    : '';
  
  const url = `${API_BASE_URL}${endpoint}${queryString}`;
  const cacheKey = url;

  // Check cache first
  const cachedData = apiCache.get<T>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Check if there's a pending request for this URL
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Create new request
  const request = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      apiCache.set(cacheKey, data);
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  };

  const promise = requestQueue.add(request, priority);
  pendingRequests.set(cacheKey, promise);
  return promise;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { RequestPriority, delay };

// Anime caching system
import { AnimeDetails, AnimeGenre } from './types';

// Cache configuration
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const CACHE_SIZE_LIMIT = 100; // Maximum number of cached items

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface Cache<T> {
  [key: string]: CacheEntry<T>;
}

// Initialize caches
const animeCache: Cache<AnimeDetails> = {};
const genreCache: Cache<AnimeGenre[]> = {};

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

export const fetchAnime = async (id: number): Promise<AnimeDetails> => {
  const cacheKey = `anime-${id}`;
  const now = Date.now();

  // Check cache first
  if (animeCache[cacheKey] && now - animeCache[cacheKey].timestamp < CACHE_DURATION) {
    console.log('Using cached anime data for:', id);
    return animeCache[cacheKey].data;
  }

  // Clean cache periodically
  cleanCache(animeCache);

  console.log('Fetching from', `https://api.jikan.moe/v4/anime/${id}`);
  const response = await fetchFromAPI(`anime/${id}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const { data } = response;
  console.log('Received data for anime:', { data });

  // Cache the result
  animeCache[cacheKey] = {
    data,
    timestamp: now
  };

  // Ensure cache doesn't grow too large
  limitCacheSize(animeCache);

  return data;
};

export const fetchAnimeGenres = async (): Promise<AnimeGenre[]> => {
  const cacheKey = 'anime-genres';
  const now = Date.now();

  // Check cache first
  if (genreCache[cacheKey] && now - genreCache[cacheKey].timestamp < CACHE_DURATION) {
    console.log('Using cached genre data');
    return genreCache[cacheKey].data;
  }

  // Clean cache periodically
  cleanCache(genreCache);

  console.log('Fetching from', 'https://api.jikan.moe/v4/genres/anime');
  const response = await fetchFromAPI('genres/anime');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const { data } = response;

  // Cache the result
  genreCache[cacheKey] = {
    data,
    timestamp: now
  };

  return data;
};

export const fetchWithRateLimit = async (url: string): Promise<Response> => {
  const now = Date.now();
  const timeSinceLastRequest = now - requestQueue.lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  requestQueue.lastRequestTime = now;
  return fetch(url);
};
