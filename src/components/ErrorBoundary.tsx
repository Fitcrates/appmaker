import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link, useNavigate, useLocation, useRouteError } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Wrapper component to access hooks and pass them to the class component
function ErrorBoundaryWrapper(props: Props) {
  const error = useRouteError();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <ErrorBoundaryClass
      {...props}
      routeError={error}
      location={location}
      navigate={navigate}
      auth={auth}
    />
  );
}

class ErrorBoundaryClass extends Component<Props & {
  routeError?: any;
  location: any;
  navigate: any;
  auth: any;
}, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private getErrorMessage(): string {
    const { error } = this.state;
    const { routeError, location } = this.props;

    if (routeError?.status === 404) {
      return `Page not found: ${location.pathname}`;
    }

    if (error?.message.includes('Failed to fetch') || error?.message.includes('Network Error')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (location.pathname.startsWith('/user/') && !this.props.auth.user) {
      return 'Please log in to access this page.';
    }

    return error?.message || routeError?.message || 'An unexpected error occurred';
  }

  private handleRetry = async () => {
    const { location, navigate, auth } = this.props;
    
    if (location.pathname.startsWith('/user/')) {
      // For protected routes, try to refresh the session first
      try {
        await auth.refreshSession();
        if (auth.user) {
          navigate(location.pathname, { replace: true });
        } else {
          navigate('/login', { 
            replace: true,
            state: { from: location.pathname }
          });
        }
      } catch (error) {
        navigate('/login', { 
          replace: true,
          state: { from: location.pathname }
        });
      }
    } else {
      // For other routes, just reload the page
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError || this.props.routeError) {
      const errorMessage = this.getErrorMessage();
      const isAuthError = errorMessage.includes('log in');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {isAuthError ? 'Authentication Required' : 'Oops! Something went wrong'}
              </h2>
              <div className="text-gray-600 mb-6">
                {errorMessage}
              </div>
              <div className="space-y-4">
                {isAuthError ? (
                  <Link
                    to="/login"
                    state={{ from: this.props.location.pathname }}
                    className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Log In
                  </Link>
                ) : (
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <Link
                  to="/"
                  className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Go to Home Page
                </Link>
              </div>
              {this.state.errorInfo && (
                <details className="mt-4 text-left text-sm text-gray-500">
                  <summary className="cursor-pointer">Technical Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundaryWrapper as ErrorBoundary };
