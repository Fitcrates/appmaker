import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          navigate('/login');
          return;
        }

        if (!session) {
          console.error('No session found');
          navigate('/login');
          return;
        }

        // Get user data from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('Error getting user data:', userError);
        }

        // Update auth metadata with user data
        if (userData?.name) {
          await supabase.auth.updateUser({
            data: { name: userData.name }
          });
        }

        // Redirect to home page
        navigate('/');
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing authentication...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}

export default AuthCallback;
