import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import { AnimePage } from './pages/AnimePage'
import AuthCallback from './pages/AuthCallback'
import GenrePage from './pages/GenrePage'
import ForumPage from './pages/ForumPage'
import { AnimeToWatch } from './components/AnimeToWatch'
import { Login } from './components/Login'
import { ResetPassword } from './components/ResetPassword'
import { UserRating } from './components/UserRating'
import UserAccountSettings from './components/UserAccountSettings'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />} errorElement={<ErrorBoundary />}>
      <Route index element={<HomePage />} />
      <Route path="anime/:id" element={
        <ErrorBoundary>
          <AnimePage />
        </ErrorBoundary>
      } />
      <Route path="genres" element={<GenrePage />} />
      <Route path="genres/:id" element={<GenrePage />} />
      <Route path="forum" element={<ForumPage />} />
      <Route path="user">
        <Route path="watchlist" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <AnimeToWatch />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="ratings" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <UserRating />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <UserAccountSettings />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
      </Route>
      <Route path="auth/callback" element={<AuthCallback />} />
      <Route path="login" element={<Login />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="*" element={<ErrorBoundary />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    },
    basename: '/' // Explicitly set the base URL
  }
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />
  </React.StrictMode>
);
