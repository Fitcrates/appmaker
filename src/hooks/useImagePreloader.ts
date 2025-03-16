import { useState, useEffect } from 'react';

// Cache to store preloaded images across the application
const imageCache = new Map<string, boolean>();

/**
 * Hook for preloading images
 * @param imageSrc - URL of the image to preload
 * @param options - Configuration options
 * @returns Object containing loading state
 */
export function useImagePreloader(
  imageSrc: string | null | undefined,
  options: {
    immediate?: boolean;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { immediate = true, onLoad, onError } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imageSrc) return;
    
    // If image is already in cache, consider it loaded
    if (imageCache.has(imageSrc)) {
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    // Don't load immediately if not specified
    if (!immediate) return;

    const img = new Image();
    
    const handleLoad = () => {
      imageCache.set(imageSrc, true);
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      const err = new Error(`Failed to load image: ${imageSrc}`);
      setError(err);
      onError?.(err);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    
    img.src = imageSrc;
    
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [imageSrc, immediate, onLoad, onError]);

  // Function to manually preload the image if immediate is false
  const preload = () => {
    if (!imageSrc || isLoaded || imageCache.has(imageSrc)) return;
    
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(imageSrc, true);
      setIsLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      const err = new Error(`Failed to load image: ${imageSrc}`);
      setError(err);
      onError?.(err);
    };
    
    img.src = imageSrc;
  };

  return { isLoaded, error, preload };
}

/**
 * Utility function to preload multiple images
 * @param imageSrcs - Array of image URLs to preload
 * @param options - Configuration options
 */
export function preloadImages(
  imageSrcs: (string | null | undefined)[],
  options: {
    sequential?: boolean;
    onProgress?: (loaded: number, total: number) => void;
    onComplete?: () => void;
  } = {}
) {
  const { sequential = false, onProgress, onComplete } = options;
  const validSrcs = imageSrcs.filter((src): src is string => !!src);
  
  if (validSrcs.length === 0) {
    onComplete?.();
    return;
  }

  let loaded = 0;
  const total = validSrcs.length;

  const loadImage = (src: string) => {
    // Skip if already cached
    if (imageCache.has(src)) {
      loaded++;
      onProgress?.(loaded, total);
      
      if (loaded === total) {
        onComplete?.();
      }
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const img = new Image();
      
      img.onload = img.onerror = () => {
        if (img.complete) {
          imageCache.set(src, true);
        }
        
        loaded++;
        onProgress?.(loaded, total);
        
        if (loaded === total) {
          onComplete?.();
        }
        
        resolve();
      };
      
      img.src = src;
    });
  };

  if (sequential) {
    // Load images one after another
    let promise = Promise.resolve();
    validSrcs.forEach(src => {
      promise = promise.then(() => loadImage(src));
    });
    return promise;
  } else {
    // Load all images in parallel
    return Promise.all(validSrcs.map(loadImage));
  }
}

/**
 * Utility function to preload images when browser is idle
 * @param imageSrcs - Array of image URLs to preload
 */
export function preloadImagesWhenIdle(imageSrcs: (string | null | undefined)[]) {
  const validSrcs = imageSrcs.filter((src): src is string => !!src);
  
  if (validSrcs.length === 0) return;
  
  const preloadBatch = (startIndex: number, batchSize: number) => {
    const endIndex = Math.min(startIndex + batchSize, validSrcs.length);
    const batch = validSrcs.slice(startIndex, endIndex);
    
    batch.forEach(src => {
      if (!imageCache.has(src)) {
        const img = new Image();
        img.onload = () => imageCache.set(src, true);
        img.src = src;
      }
    });
    
    if (endIndex < validSrcs.length) {
      // Schedule next batch when browser is idle
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(
          // Ignore the deadline parameter since we're not using it
          () => preloadBatch(endIndex, batchSize),
          { timeout: 1000 }
        );
      } else {
        setTimeout(() => preloadBatch(endIndex, batchSize), 1);
      }
    }
  };
  
  // Start preloading with small batches
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(
      // Ignore the deadline parameter since we're not using it
      () => preloadBatch(0, 5),
      { timeout: 1000 }
    );
  } else {
    setTimeout(() => preloadBatch(0, 5), 1);
  }
}
