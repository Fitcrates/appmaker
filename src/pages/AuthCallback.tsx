import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to get session');
          navigate('/login', {
            replace: true,
            state: { error: 'Authentication failed. Please try again.' }
          });
          return;
        }

        if (session) {
          // Successful authentication
          navigate('/', {
            replace: true,
            state: { message: 'Successfully signed in!' }
          });
        } else {
          // No session found
          navigate('/login', {
            replace: true,
            state: { error: 'Authentication failed. Please try again.' }
          });
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Auth callback error:', err);
        setError('An unexpected error occurred');
        navigate('/login', {
          replace: true,
          state: { error: 'An unexpected error occurred. Please try again.' }
        });
      }
    };

    // Set a timeout to redirect to login if it takes too long
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.error('Auth callback timeout');
        setError('Authentication timed out');
        navigate('/login', {
          replace: true,
          state: { error: 'Authentication timed out. Please try again.' }
        });
      }
    }, 10000); // 10 second timeout

    checkSession();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Completing authentication...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
