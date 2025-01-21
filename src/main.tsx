import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AnimePage from './pages/AnimePage'
import AuthCallback from './pages/AuthCallback'
import GenrePage from './pages/GenrePage'
import { AnimeToWatch } from './components/AnimeToWatch'

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
        path: '/watchlist',
        element: <AnimeToWatch />,
      },
      {
        path: '/auth/callback',
        element: <AuthCallback />,
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
