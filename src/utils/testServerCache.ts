/**
 * Test utility for the server cache
 * This file is not used in production, just for testing the cache function
 */

import { fetchFromServerCache } from './serverCache';

export const testServerCache = async () => {
  console.log('Testing server cache...');
  
  try {
    // Test top anime
    console.log('Testing /top/anime endpoint...');
    const topAnime = await fetchFromServerCache('/top/anime', {
      page: 1,
      limit: 10,
      filter: 'bypopularity'
    });
    console.log('Top anime cache test successful:', topAnime.data?.length);
    
    // Test top movies
    console.log('Testing /top/anime (movies) endpoint...');
    const topMovies = await fetchFromServerCache('/top/anime', {
      type: 'movie',
      limit: 7
    });
    console.log('Top movies cache test successful:', topMovies.data?.length);
    
    // Test current season
    console.log('Testing /seasons/now endpoint...');
    const currentSeason = await fetchFromServerCache('/seasons/now', {
      page: 1,
      limit: 10
    });
    console.log('Current season cache test successful:', currentSeason.data?.length);
    
    // Test schedules
    console.log('Testing /schedules endpoint...');
    const schedules = await fetchFromServerCache('/schedules', {
      filter: 'tuesday',
      page: 1,
      limit: 12,
      sfw: true
    });
    console.log('Schedules cache test successful:', schedules.data?.length);
    
    // Test anime endpoint
    console.log('Testing /anime endpoint...');
    const animeList = await fetchFromServerCache('/anime', {
      page: 1,
      limit: 25,
      order_by: 'score',
      sort: 'desc',
      sfw: true
    });
    console.log('Anime list cache test successful:', animeList.data?.length);
    
    console.log('All server cache tests passed!');
  } catch (error) {
    console.error('Server cache test failed:', error);
  }
};

// Uncomment to run the test
// testServerCache();
