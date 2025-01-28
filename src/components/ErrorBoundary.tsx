import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
              <div className="text-gray-600 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
                <Link
                  to="/"
                  className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Go to Home Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
