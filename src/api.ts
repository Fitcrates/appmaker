const BASE_URL = 'https://api.jikan.moe/v4';

interface APIParams {
  [key: string]: string;
}

export async function fetchFromAPI<T>(endpoint: string, params: APIParams = {}): Promise<T> {
  // Add a small delay to respect rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));

  const queryParams = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${endpoint}${queryParams ? `?${queryParams}` : ''}`;
  
  console.log('Fetching from', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Rate limit helper
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

export async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => 
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
}
