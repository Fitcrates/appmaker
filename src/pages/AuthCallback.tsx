import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Starting authentication...');
        console.log('Auth callback started', {
          hash: location.hash,
          pathname: location.pathname,
          isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        });

        // For mobile flow, check hash parameters
        if (location.hash) {
          setStatus('Processing mobile authentication...');
          const hashParams = new URLSearchParams(location.hash.substring(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            console.log('Found tokens in URL hash');
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });

            if (error) {
              console.error('Error setting session from hash:', error);
              throw error;
            }

            if (data.session) {
              console.log('Successfully set session from hash');
              navigate('/', { replace: true });
              return;
            }
          }
        }

        // Try getting session normally
        setStatus('Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }

        if (!session) {
          console.log('No session found');
          setStatus('No session found, redirecting...');
          navigate('/login', { replace: true });
          return;
        }

        // Successfully authenticated
        console.log('Auth callback successful, session found');
        setStatus('Authentication successful!');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Error in auth callback:', error);
        setStatus('Authentication failed');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6 max-w-sm mx-auto">
        <h2 className="text-xl font-semibold mb-4">Authentication in Progress</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">{status}</p>
        <p className="text-xs text-gray-500">
          If you're not redirected within a few seconds,{' '}
          <button 
            onClick={() => navigate('/login')} 
            className="text-blue-500 hover:text-blue-600"
          >
            click here
          </button>
        </p>
      </div>
    </div>
  );
}
