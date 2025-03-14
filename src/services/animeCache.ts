interface CachedAnime {
  title: string;
  image_url: string;
  timestamp: number;
}

class AnimeCache {
  private cache: Map<number, CachedAnime>;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly STORAGE_KEY = 'anime_cache';

  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(Object.entries(data).map(([key, value]) => [Number(key), value as CachedAnime]));
        this.cleanExpiredEntries();
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  private cleanExpiredEntries() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
    this.saveToStorage();
  }

  get(animeId: number): CachedAnime | undefined {
    const cached = this.cache.get(animeId);
    if (cached && Date.now() - cached.timestamp <= this.CACHE_DURATION) {
      return cached;
    }
    return undefined;
  }

  set(animeId: number, title: string, image_url: string) {
    this.cache.set(animeId, {
      title,
      image_url,
      timestamp: Date.now()
    });
    this.saveToStorage();
  }

  async getAnimeDetails(animeId: number): Promise<{ title: string; image_url: string }> {
    const cached = this.get(animeId);
    if (cached) {
      return {
        title: cached.title,
        image_url: cached.image_url
      };
    }

    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const details = {
      title: data.data.title,
      image_url: data.data.images.jpg.image_url
    };
    
    this.set(animeId, details.title, details.image_url);
    return details;
  }
}

export const animeCache = new AnimeCache();
