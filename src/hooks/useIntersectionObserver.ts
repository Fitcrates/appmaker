import { useEffect, useState, RefObject } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
}

export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  { threshold = 0, rootMargin = '200px' }: UseIntersectionObserverProps = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('Intersection Observer:', {
          element: entry.target.className,
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          boundingClientRect: entry.boundingClientRect
        });
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      observer.disconnect();
    };
  }, [elementRef, threshold, rootMargin]);

  return { isIntersecting };
}
