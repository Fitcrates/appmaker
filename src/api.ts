const API_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

// Cache configuration
const CACHE_PREFIX = 'anime-api-cache:';
const CACHE_DURATION = {
  TOP_ANIME: 5 * 60 * 1000, // 5 minutes
  SCHEDULES: 30 * 60 * 1000, // 30 minutes
  GENRES: 24 * 60 * 60 * 1000, // 24 hours
  DEFAULT: 2 * 60 * 1000 // 2 minutes
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
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
          this.lastRequestTime = Date.now();
          await request();
        } catch (error) {
          console.error('Error processing request:', error);
        }
      }
    }
    this.processing = false;
  }
}

// Cache management
const getCacheKey = (endpoint: string, params?: Record<string, string | number | boolean>): string => {
  const queryString = params
    ? new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()
    : '';
  return CACHE_PREFIX + endpoint + (queryString ? '?' + queryString : '');
};

const getCacheDuration = (endpoint: string): number => {
  if (endpoint.startsWith('/top/anime')) return CACHE_DURATION.TOP_ANIME;
  if (endpoint.startsWith('/schedules')) return CACHE_DURATION.SCHEDULES;
  if (endpoint.startsWith('/genres')) return CACHE_DURATION.GENRES;
  return CACHE_DURATION.DEFAULT;
};

const getFromCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    console.log('Cache hit:', key);
    return entry.data;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
};

const setInCache = <T>(key: string, data: T, duration: number): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    };
    localStorage.setItem(key, JSON.stringify(entry));
    console.log('Cached:', key);
  } catch (error) {
    console.warn('Cache write error:', error);
  }
};

// Initialize request queue
const requestQueue = RequestQueue.getInstance();

// Utility function to delay execution
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export enum RequestPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2,
}

export const fetchFromAPI = async <T>(
  endpoint: string, 
  params?: Record<string, string | number | boolean>,
  priority: RequestPriority = RequestPriority.MEDIUM
): Promise<T> => {
  const cacheKey = getCacheKey(endpoint, params);
  const cacheDuration = getCacheDuration(endpoint);
  
  // Try cache first
  const cachedData = getFromCache<T>(cacheKey);
  if (cachedData) return cachedData;

  return requestQueue.add(async () => {
    try {
      const url = `${API_BASE_URL}${endpoint}${params ? '?' + new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString() : ''}`;
      
      console.log('Fetching from', url);
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          console.log('Rate limit hit, waiting 3 seconds...');
          await delay(3000);
          return fetchFromAPI<T>(endpoint, params, priority);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: expected JSON');
      }

      const data = await response.json();
      
      // Cache the successful response
      setInCache(cacheKey, data, cacheDuration);
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  });
};
