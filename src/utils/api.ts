const API_BASE_URL = 'https://api.jikan.moe/v4';

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // Cache durations in milliseconds
  private static readonly CACHE_DURATIONS = {
    ANIME_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
    TOP_ANIME: 12 * 60 * 60 * 1000,      // 12 hours
    SCHEDULES: 6 * 60 * 60 * 1000,      // 6 hour
    SEASONS: 6 * 60 * 60 * 1000,        // 6 hour for current season
  };

  set<T>(key: string, data: T, duration: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + duration
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp) {
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
    return 0; // No cache for other endpoints
  }
}

enum RequestPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2,
}

interface QueueItem {
  priority: RequestPriority;
  execute: () => Promise<void>;
}

// Queue for managing API requests
class RequestQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private requestsInLastMinute = 0;
  private readonly minDelay = 750; // 0.75 second between requests
  private readonly maxRequestsPerMinute = 60; // Updated to match Jikan API limit

  async add<T>(request: () => Promise<T>, priority: RequestPriority = RequestPriority.MEDIUM): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem = {
        priority,
        execute: async () => {
          try {
            const result = await this.executeRequest(request);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      };

      // Insert based on priority
      const insertIndex = this.queue.findIndex(item => item.priority > priority);
      if (insertIndex === -1) {
        this.queue.push(queueItem);
      } else {
        this.queue.splice(insertIndex, 0, queueItem);
      }

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    // Reset counter if a minute has passed
    const now = Date.now();
    if (now - this.lastRequestTime >= 60000) {
      this.requestsInLastMinute = 0;
    }

    // Wait if we've hit the per-minute limit
    if (this.requestsInLastMinute >= this.maxRequestsPerMinute) {
      console.log('Rate limit reached, waiting for reset...');
      const waitTime = 60000 - (now - this.lastRequestTime);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestsInLastMinute = 0;
      }
    }

    const queueItem = this.queue.shift();
    if (queueItem) {
      try {
        await queueItem.execute();
      } catch (error) {
        console.error('Request failed in queue:', error);
      }

      // Calculate and apply rate limiting delay
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      const delay = Math.max(0, this.minDelay - timeSinceLastRequest);

      this.lastRequestTime = Date.now();
      this.requestsInLastMinute++;

      // Wait before processing next request
      await new Promise(resolve => setTimeout(resolve, delay));
      this.processQueue();
    }
  }

  private async executeRequest<T>(request: () => Promise<T>): Promise<T> {
    const maxRetries = 3;
    let lastError: any;
    let retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await request();
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`API request failed (attempt ${i + 1}/${maxRetries}):`, error);

        if (error.status === 429) {
          const waitTime = retryDelay + Math.random() * 1000;
          console.log(`Rate limited. Waiting ${Math.round(waitTime/1000)}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryDelay *= 2;
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }
}

const requestQueue = new RequestQueue();
const apiCache = new APICache();

export async function fetchFromAPI<T>(
  endpoint: string, 
  params: Record<string, string> = {}, 
  priority: RequestPriority = RequestPriority.MEDIUM
): Promise<T> {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  const cacheKey = url;

  // Skip cache for random anime
  if (!endpoint.includes('/random')) {
    const cachedData = apiCache.get<T>(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${endpoint}`);
      return cachedData;
    }
  }

  console.log(`Fetching from ${url}`);

  return requestQueue.add(async () => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        
        const error = new Error(`API request failed: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      
      // Cache the response if applicable
      const cacheDuration = apiCache.getCacheDuration(endpoint);
      if (cacheDuration > 0) {
        apiCache.set(cacheKey, data, cacheDuration);
      }
      
      console.log(`Success fetching ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw error;
    }
  }, priority);
}

// Export RequestPriority enum for use in components
export { RequestPriority };

// Utility function to delay loading of components
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Prefetch function for anime details
export function prefetchAnimeDetails(animeId: string): void {
  const endpoint = `/anime/${animeId}`;
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Only prefetch if not in cache
  if (!apiCache.get(url)) {
    fetchFromAPI(endpoint, {}, RequestPriority.LOW)
      .catch(() => {}); // Ignore prefetch errors
  }
}
