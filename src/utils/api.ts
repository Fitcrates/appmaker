const API_BASE_URL = 'https://api.jikan.moe/v4';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export enum RequestPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2,
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

// Initialize request queue
const requestQueue = RequestQueue.getInstance();

// Utility function to delay execution
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchFromAPI = async <T>(
  endpoint: string, 
  params?: Record<string, string | number | boolean>,
  priority: RequestPriority = RequestPriority.MEDIUM
): Promise<T> => {
  const queryString = params
    ? '?' + new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()
    : '';
  
  const fullEndpoint = `${endpoint}${queryString}`;

  return requestQueue.add(async () => {
    try {
      const url = `${API_BASE_URL}${fullEndpoint}`;
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
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  });
};
