import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const checkSession = async () => {
      try {
        // First try to get the session from the URL (for mobile browsers)
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: { session }, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (setSessionError) throw setSessionError;
          if (session) {
            navigate('/', {
              replace: true,
              state: { message: 'Successfully signed in!' }
            });
            return;
          }
        }

        // If no tokens in URL, try to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (session) {
          navigate('/', {
            replace: true,
            state: { message: 'Successfully signed in!' }
          });
        } else if (attempts < 3) {
          // Retry a few times for mobile browsers
          setAttempts(prev => prev + 1);
          timeoutId = setTimeout(checkSession, 2000);
        } else {
          throw new Error('No session found after multiple attempts');
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Auth callback error:', err);
        setError('Authentication failed');
        navigate('/login', {
          replace: true,
          state: { error: 'Authentication failed. Please try again.' }
        });
      }
    };

    // Set a timeout to redirect to login if it takes too long
    const maxTimeout = setTimeout(() => {
      if (mounted) {
        console.error('Auth callback timeout');
        setError('Authentication timed out');
        navigate('/login', {
          replace: true,
          state: { error: 'Authentication timed out. Please try again.' }
        });
      }
    }, 15000); // 15 second timeout

    checkSession();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      clearTimeout(maxTimeout);
    };
  }, [navigate, location, attempts]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {attempts > 0 ? `Completing authentication (attempt ${attempts + 1}/4)...` : 'Completing authentication...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
