import React, { useEffect, useState } from 'react';
import { delay } from '../utils/api';

interface LazyLoadProps {
  children: React.ReactNode;
  delay?: number;
}

export function LazyLoad({ children, delay: delayMs = 0 }: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      await delay(delayMs);
      setIsVisible(true);
    };
    load();
  }, [delayMs]);

  if (!isVisible) {
    return (
      <div className="animate-pulse bg-black/20 rounded-lg  w-full"></div>
    );
  }

  return <>{children}</>;
}
