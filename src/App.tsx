import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <div className="bg-gray-50">
        <ScrollToTop />
        <Layout>
          <div className="container mx-auto">
            <Outlet />
          </div>
        </Layout>
      </div>
    </AuthProvider>
  );
}

export default App;