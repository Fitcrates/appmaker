const API_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  priority: RequestPriority;
}

// Request queue to handle rate limiting
class RequestQueue {
  private static instance: RequestQueue;
  private queues: Map<RequestPriority, Array<() => Promise<any>>> = new Map();
  private processing = false;
  private lastRequestTime = 0;

  private constructor() {
    this.queues.set(RequestPriority.HIGH, []);
    this.queues.set(RequestPriority.MEDIUM, []);
    this.queues.set(RequestPriority.LOW, []);
  }

  static getInstance(): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }

  async add<T>(request: () => Promise<T>, priority: RequestPriority): Promise<T> {
    return new Promise((resolve, reject) => {
      const queue = this.queues.get(priority)!;
      queue.push(async () => {
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
    if (this.processing) return;
    this.processing = true;

    while (this.hasRequests()) {
      const now = Date.now();
      const timeToWait = Math.max(0, RATE_LIMIT_DELAY - (now - this.lastRequestTime));
      
      if (timeToWait > 0) {
        await delay(timeToWait);
      }

      // Process requests in priority order
      const request = this.getNextRequest();
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

  private hasRequests(): boolean {
    return Array.from(this.queues.values()).some(queue => queue.length > 0);
  }

  private getNextRequest(): (() => Promise<any>) | undefined {
    // Try to get requests in priority order
    for (const priority of [RequestPriority.HIGH, RequestPriority.MEDIUM, RequestPriority.LOW]) {
      const queue = this.queues.get(priority)!;
      if (queue.length > 0) {
        return queue.shift();
      }
    }
    return undefined;
  }
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private static readonly MAX_CACHE_SIZE = 100;
  
  // Cache durations in milliseconds
  private static readonly CACHE_DURATIONS = {
    ANIME_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
    TOP_ANIME: 6 * 60 * 60 * 1000,      // 6 hours (reduced from 12)
    SCHEDULES: 15 * 60 * 1000,          // 15 minutes (reduced from 30)
    SEASONS: 3 * 60 * 60 * 1000,        // 3 hours (reduced from 6)
    RANDOM: 0,                          // No cache for random
    DEFAULT: 5 * 60 * 1000              // 5 minutes default
  };

  set<T>(key: string, data: T, priority: RequestPriority): void {
    const duration = this.getCacheDuration(key);
    if (duration === 0) return;
    
    // Clean up old entries if cache is too large
    if (this.cache.size >= APICache.MAX_CACHE_SIZE) {
      this.cleanOldEntries();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      priority
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const duration = this.getCacheDuration(key);
    if (duration === 0) return null;
    
    if (Date.now() - entry.timestamp > duration) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private cleanOldEntries(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by priority first, then by timestamp
    entries.sort(([, a], [, b]) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.timestamp - a.timestamp;
    });
    
    // Remove oldest entries
    const entriesToRemove = entries.slice(APICache.MAX_CACHE_SIZE / 2);
    entriesToRemove.forEach(([key]) => this.cache.delete(key));
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

import { fetchFromServerCache, shouldUseServerCache } from './serverCache';

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

export const fetchFromAPI = async <T>(
  endpoint: string, 
  params?: Record<string, string | number | boolean>, 
  priority: RequestPriority = RequestPriority.MEDIUM
): Promise<T> => {
  const queryString = params
    ? '?' + new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()
    : '';
  
  const fullEndpoint = `${endpoint}${queryString}`;
  const cacheKey = fullEndpoint;
  
  // Skip cache for search queries
  const isSearchQuery = params && 'q' in params;
  
  // Check if we should use server-side caching
  if (!isSearchQuery && shouldUseServerCache(endpoint, params)) {
    try {
      console.log('Using server cache for:', endpoint);
      return await fetchFromServerCache<T>(endpoint, params || {});
    } catch (error) {
      console.warn('Server cache failed, falling back to direct API call:', error);
      // Fall back to regular API call if server cache fails
    }
  }
  
  // Check cache first (unless it's a search query or bypass_cache is true)
  if (!isSearchQuery && !params?.bypass_cache) {
    const cachedData = apiCache.get<T>(cacheKey);
    if (cachedData) {
      console.log('Cache hit for', fullEndpoint);
      return cachedData;
    }
  } else {
    console.log('Bypassing cache for', isSearchQuery ? 'search query' : 'bypass_cache parameter');
  }

  // Check if there's already a pending request for this endpoint
  const pendingKey = `pending_${cacheKey}`;
  // Don't reuse pending requests for search queries or when bypass_cache is true
  if (!isSearchQuery && !params?.bypass_cache) {
    const pendingPromise = pendingRequests.get(pendingKey);
    if (pendingPromise) {
      console.log('Using pending request for', fullEndpoint);
      return pendingPromise as Promise<T>;
    }
  }

  // Create a new promise for this request
  const promise = requestQueue.add(async () => {
    try {
      const url = `${API_BASE_URL}${fullEndpoint}`;
      console.log('Fetching from', url);
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          console.log('Rate limit hit, waiting before retry...');
          await delay(3000);
          return fetchFromAPI(endpoint, params, priority);
        }
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      // Don't cache search query results
      if (!isSearchQuery && !params?.bypass_cache) {
        apiCache.set(cacheKey, data, priority);
      }
      pendingRequests.delete(pendingKey);
      return data;
    } catch (error) {
      pendingRequests.delete(pendingKey);
      throw error;
    }
  }, priority);

  pendingRequests.set(pendingKey, promise);
  return promise;
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
  }, RequestPriority.HIGH);

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
  }, RequestPriority.MEDIUM);

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
