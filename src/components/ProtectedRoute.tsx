import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, refreshSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Try to refresh session when mounting protected route
    if (!user && !loading) {
      refreshSession().catch(console.error);
    }
  }, [user, loading, refreshSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for redirecting after login
    return (
      <Navigate
        to="/login"
        replace={true}
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}
