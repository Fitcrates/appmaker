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

  getCacheDuration(endpoint: string): number {
    if (endpoint.includes('/anime/')) return APICache.CACHE_DURATIONS.ANIME_DETAILS;
    if (endpoint.includes('/top/anime')) return APICache.CACHE_DURATIONS.TOP_ANIME;
    if (endpoint.includes('/schedules')) return APICache.CACHE_DURATIONS.SCHEDULES;
    if (endpoint.includes('/seasons/now')) return APICache.CACHE_DURATIONS.SEASONS;
    if (endpoint.includes('/random/anime')) return APICache.CACHE_DURATIONS.RANDOM;
    return APICache.CACHE_DURATIONS.DEFAULT;
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new APICache();
const requestQueue = RequestQueue.getInstance();

export const fetchFromAPI = async <T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> => {
  const queryString = params
    ? '?' + new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()
    : '';
  
  const fullEndpoint = `${endpoint}${queryString}`;
  
  // Check cache first
  const cachedData = apiCache.get<T>(fullEndpoint);
  if (cachedData) {
    console.log('Cache hit for', fullEndpoint);
    return cachedData;
  }

  // Queue the request
  return requestQueue.add(async () => {
    try {
      console.log('Fetching from', `${API_BASE_URL}${fullEndpoint}`);
      const response = await fetch(`${API_BASE_URL}${fullEndpoint}`);

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer and try again
          await delay(3000);
          return fetchFromAPI(endpoint, params);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the successful response
      apiCache.set(fullEndpoint, data);

      return data;
    } catch (error) {
      console.error('Error fetching from API:', error);
      throw error;
    }
  });
};

// Utility function to delay loading of components
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

enum RequestPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2,
}

export { RequestPriority, delay };
