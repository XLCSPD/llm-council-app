import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthCallbackPage() {
  const { isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for error parameters from Supabase
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      setError(errorDescription || errorParam);
      return;
    }

    // If authenticated, redirect to home
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  // Timeout - if auth doesn't complete in 10 seconds, something went wrong
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAuthenticated && !error) {
        setError('Authentication timed out. Please try signing in again.');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-xl font-semibold text-red-400 mb-4">
            Authentication Error
          </h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <a
            href="/"
            className="text-accent hover:underline"
          >
            Return to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" />
        <p className="text-text-secondary">Confirming your account...</p>
      </div>
    </div>
  );
}
