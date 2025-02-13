import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ScrollToTop } from './components/ScrollToTop';
import CookieConsentManager from './cookies/CookieConsent';
import { DataProvider } from './context/DataContext';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <div className="bg-gray-50">
          <ScrollToTop />
          <CookieConsentManager />

          <Layout>
            <div className="container mx-auto">
              <Outlet />
            </div>
          </Layout>
        </div>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;