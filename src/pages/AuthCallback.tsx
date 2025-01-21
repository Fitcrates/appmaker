import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a signup confirmation
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        let verificationSuccess = false;

        console.log('Auth callback params:', { token_hash, type });

        if (token_hash && type) {
          try {
            console.log('Attempting to verify OTP...');
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash,
              type: type as any,
            });
            console.log('Verify OTP response:', { data, verifyError });

            if (!verifyError) {
              verificationSuccess = true;
              console.log('Verification successful');
            } else {
              console.error('Verification error:', verifyError);
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
          }
        } else {
          console.log('No token_hash or type found in URL');
        }

        // Get the current session
        console.log('Checking current session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Session check result:', { session, sessionError });

        // If we have a session, the user is authenticated
        if (session) {
          navigate('/', {
            replace: true,
            state: {
              message: verificationSuccess
                ? 'Email verified successfully! You are now signed in.'
                : 'Authentication successful!'
            }
          });
          return;
        }

        // If we got here without a session but verification was successful,
        // tell the user to sign in
        if (verificationSuccess) {
          navigate('/', {
            replace: true,
            state: {
              message: 'Email verified successfully! Please sign in with your credentials.'
            }
          });
          return;
        }

        throw new Error(
          sessionError?.message || 
          'Authentication failed. Please try signing in with your email and password.'
        );

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message);
        setTimeout(() => {
          navigate('/', {
            replace: true,
            state: { error: err.message }
          });
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting you back...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
