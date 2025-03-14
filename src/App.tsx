import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ScrollToTop } from './components/ScrollToTop';
import CookieConsentManager from './cookies/CookieConsent';
import { DataProvider } from './context/DataContext';
import { prefetchAnimeToWatch, prefetchUserRating } from './utils/prefetch';
import LoginPrompt from './components/LoginPrompt';

function App() {
  // Preload critical components when the app starts
  useEffect(() => {
    // Use requestIdleCallback to preload components during browser idle time
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        // Preload components with a slight delay to prioritize initial render
        setTimeout(() => {
          prefetchAnimeToWatch();
          prefetchUserRating();
        }, 2000);
      });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        prefetchAnimeToWatch();
        prefetchUserRating();
      }, 3000);
    }
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        <div className="p-0">
          <ScrollToTop />
          <CookieConsentManager />

          <Layout>
            <div className="container mx-auto">
              <Outlet />
              <LoginPrompt />
            </div>
          </Layout>
        </div>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
