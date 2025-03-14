import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderClassName = '',
  onLoad,
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // If priority is true, we load the image immediately without intersection observer
    if (priority) {
      setIsInView(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          // Disconnect the observer once the image is in view
          if (observerRef.current && imgRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      {
        rootMargin: '200px', // Start loading when image is 200px from viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  return (
    <div 
      ref={imgRef}
      className={`relative ${className}`}
      style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : 'auto' }}
    >
      {!isLoaded && (
        <div 
          className={`animate-pulse bg-black/20 rounded-lg absolute inset-0 ${placeholderClassName}`}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { importance: 'high' } : { importance: 'low' })}
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
}
