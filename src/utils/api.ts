const API_BASE_URL = 'https://api.jikan.moe/v4';

// Queue for managing API requests
class RequestQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private requestsInLastMinute = 0;
  private readonly minDelay = 1000; // 1 second between requests
  private readonly maxRequestsPerMinute = 30;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeRequest(request);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

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

    const request = this.queue.shift();
    if (request) {
      try {
        await request();
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

export async function fetchFromAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

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
      console.log(`Success fetching ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw error;
    }
  });
}

// Utility function to delay loading of components
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
