import React, { createContext, useContext, useEffect, useState, Suspense } from 'react';
import { fetchFromAPI, RequestPriority } from '../utils/api';

interface AnimeData {
  scheduleData: any[];
  topAnimeData: any[];
  currentSeasonData: any[];
  isLoading: boolean;
  error: Error | null;
}

const DataContext = createContext<AnimeData | undefined>(undefined);

// Create resource loaders for each data type
const createResource = (promise: Promise<any>) => {
  let status = 'pending';
  let result: any;
  let suspender = promise.then(
    (r) => {
      status = 'success';
      result = r;
    },
    (e) => {
      status = 'error';
      result = e;
    }
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    }
  };
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AnimeData>({
    scheduleData: [],
    topAnimeData: [],
    currentSeasonData: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Load data in order of importance
    const loadData = async () => {
      try {
        // First load top anime and current season (high priority)
        const [topAnimeResponse, seasonResponse] = await Promise.all([
          fetchFromAPI('/top/anime', {
            page: '1',
            limit: '10',
            filter: 'bypopularity'
          }, RequestPriority.HIGH),
          fetchFromAPI('/seasons/now', {
            page: '1',
            limit: '10'
          }, RequestPriority.HIGH)
        ]);

        setData(prev => ({
          ...prev,
          topAnimeData: topAnimeResponse.data,
          currentSeasonData: seasonResponse.data,
          isLoading: true,
        }));

        // Then load schedule data (lower priority)
        const scheduleResponse = await fetchFromAPI('/schedules', {
          filter: 'friday',
          page: '1',
          limit: '12',
          sfw: 'true'
        }, RequestPriority.LOW);

        setData(prev => ({
          ...prev,
          scheduleData: scheduleResponse.data,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    };

    loadData();
  }, []); // Only fetch once on mount

  return (
    <DataContext.Provider value={data}>
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        {children}
      </Suspense>
    </DataContext.Provider>
  );
}

export function useAnimeData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useAnimeData must be used within a DataProvider');
  }
  return context;
}
