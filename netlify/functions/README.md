# Netlify Serverless Functions for AnimeSearch

This directory contains serverless functions that run on Netlify to enhance the AnimeSearch application.

## Cache Function

The `cache.js` function provides server-side caching for Jikan API requests to improve performance and reduce API calls.

### How It Works

1. When the frontend makes a request to the Jikan API for specific endpoints (top anime, schedules, etc.), it first checks with our cache function.
2. The cache function checks if it has a valid cached response for that endpoint.
3. If a valid cache exists, it returns the cached data immediately.
4. If no valid cache exists, it fetches fresh data from the Jikan API, caches it, and returns it.

### Cached Endpoints

The following endpoints are cached with different durations:

- `/top/anime` (regular): Cached for 6 hours
- `/top/anime?type=movie`: Cached for 12 hours
- `/seasons/now`: Cached for 3 hours
- `/schedules`: Cached for 30 minutes (per day)
- `/anime`: Cached for 6 hours (only for non-search requests)

### API

The cache function is accessible at `/.netlify/functions/cache` and accepts the following query parameters:

- `endpoint`: (Required) The Jikan API endpoint to fetch (e.g., `/top/anime`)
- `page`: (Optional) The page number (default: 1)
- `limit`: (Optional) The number of items per page (default: 10)
- `filter`: (Optional) Filter parameter (e.g., day of the week for schedules)
- `type`: (Optional) Type filter (e.g., 'movie' for anime type)
- `sfw`: (Optional) Safe for work filter (boolean)

### Example Usage

```javascript
// Fetch top anime from the cache
fetch('/.netlify/functions/cache?endpoint=/top/anime&page=1&limit=10&filter=bypopularity')
  .then(response => response.json())
  .then(data => console.log(data));

// Fetch top movies from the cache
fetch('/.netlify/functions/cache?endpoint=/top/anime&type=movie&limit=7')
  .then(response => response.json())
  .then(data => console.log(data));

// Fetch current season from the cache
fetch('/.netlify/functions/cache?endpoint=/seasons/now&page=1&limit=10')
  .then(response => response.json())
  .then(data => console.log(data));

// Fetch schedules from the cache
fetch('/.netlify/functions/cache?endpoint=/schedules&filter=tuesday&page=1&limit=12&sfw=true')
  .then(response => response.json())
  .then(data => console.log(data));

// Fetch anime list sorted by score from the cache
fetch('/.netlify/functions/cache?endpoint=/anime&page=1&limit=25&order_by=score&sort=desc&sfw=true')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Deployment

The function is automatically deployed when you deploy to Netlify. No additional configuration is needed.

### Troubleshooting

If you encounter issues with the cache function:

1. Check the Netlify function logs in the Netlify dashboard.
2. Ensure the function has proper permissions to make outbound requests.
3. Verify that the Jikan API is accessible and responding correctly.
4. The frontend will automatically fall back to direct API calls if the cache function fails.
