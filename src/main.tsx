import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AnimePage from './pages/AnimePage'
import AuthCallback from './pages/AuthCallback'

import GenrePage from './pages/GenrePage'
import ForumPage from './pages/ForumPage'
import { AnimeToWatch } from './components/AnimeToWatch'
import { Login } from './components/Login'
import { ResetPassword } from './components/ResetPassword'
import { UserRating } from './components/UserRating'
import UserAccountSettings from './components/UserAccountSettings'
import { ProtectedRoute } from './components/ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/anime/:id',
        element: <AnimePage />,
      },
      {
        path: '/genres',
        element: <GenrePage />,
      },
      {
        path: '/genres/:id',
        element: <GenrePage />,
      },
      {
        path: '/forum',
        element: <ForumPage />,
      },
      {
        path: '/user/watchlist',
        element: (
          <ProtectedRoute>
            <AnimeToWatch />
          </ProtectedRoute>
        ),
      },
      {
        path: '/user/ratings',
        element: (
          <ProtectedRoute>
            <UserRating />
          </ProtectedRoute>
        ),
      },
      {
        path: '/user/settings',
        element: (
          <ProtectedRoute>
            <UserAccountSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: '/auth/callback',
        element: <AuthCallback />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/reset-password',
        element: <ResetPassword />,
      },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
