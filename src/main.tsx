import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/rtl.css'
import './styles/translate-fixes.css'
import './styles/google-translate.css'
import './styles/language.css'
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
import { AnimeCharacters } from "./components/anime/AnimeCharacters"
import { CharacterDetails } from "./components/anime/CharacterDetails"
import { AuthProvider } from './context/AuthContext'
import PrivacyPolicy from './cookies/privacy-policy'

// No need for custom language handling here - Google Translate handles it

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />} errorElement={
      <AuthProvider>
        <ErrorBoundary />
      </AuthProvider>
    }>
      <Route index element={
        <AuthProvider>
          <ErrorBoundary>
            <HomePage />
          </ErrorBoundary>
        </AuthProvider>
      } />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      <Route path="anime/:id" element={
        <AuthProvider>
          <ErrorBoundary>
            <AnimePage />
          </ErrorBoundary>
        </AuthProvider>
      } />
      <Route path="genres" element={
        <AuthProvider>
          <ErrorBoundary>
            <GenrePage />
          </ErrorBoundary>
        </AuthProvider>
      } />
      <Route path="genres/:id" element={
        <AuthProvider>
          <ErrorBoundary>
            <GenrePage />
          </ErrorBoundary>
        </AuthProvider>
      } />
      <Route path="forum" element={
        <AuthProvider>
          <ErrorBoundary>
            <ForumPage />
          </ErrorBoundary>
        </AuthProvider>
      } />
      <Route path="/anime/:id/characters" element={
        <AuthProvider>
          <ErrorBoundary>
            <AnimeCharacters />
          </ErrorBoundary>
        </AuthProvider>
      } />
      <Route path="/character/:id" element={
        <AuthProvider>
          <ErrorBoundary>
            <CharacterDetails />
          </ErrorBoundary>
        </AuthProvider>
      } />
      <Route path="user">
        <Route path="watchlist" element={
          <AuthProvider>
            <ProtectedRoute>
              <ErrorBoundary>
                <AnimeToWatch />
              </ErrorBoundary>
            </ProtectedRoute>
          </AuthProvider>
        } />
        <Route path="ratings" element={
          <AuthProvider>
            <ProtectedRoute>
              <ErrorBoundary>
                <UserRating />
              </ErrorBoundary>
            </ProtectedRoute>
          </AuthProvider>
        } />
        <Route path="settings" element={
          <AuthProvider>
            <ProtectedRoute>
              <ErrorBoundary>
                <UserAccountSettings />
              </ErrorBoundary>
            </ProtectedRoute>
          </AuthProvider>
        } />
      </Route>
      <Route path="auth">
        <Route path="callback" element={
          <AuthProvider>
            <ErrorBoundary>
              <AuthCallback />
            </ErrorBoundary>
          </AuthProvider>
        } />
        <Route path="login" element={
          <AuthProvider>
            <ErrorBoundary>
              <Login />
            </ErrorBoundary>
          </AuthProvider>
        } />
        <Route path="reset-password" element={
          <AuthProvider>
            <ErrorBoundary>
              <ResetPassword />
            </ErrorBoundary>
          </AuthProvider>
        } />
      </Route>
      <Route path="*" element={
        <AuthProvider>
          <ErrorBoundary />
        </AuthProvider>
      } />
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
