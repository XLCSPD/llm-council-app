import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export function AuthCallbackPage() {
  const { isAuthenticated, user, initialize } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'accepting_invite' | 'success' | 'error'>('loading');
  const [inviteAccepted, setInviteAccepted] = useState(false);
  const inviteProcessedRef = useRef(false);
  const initRef = useRef(false);

  // Initialize auth store to detect tokens in URL
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initialize();
    }
  }, [initialize]);

  useEffect(() => {
    // Check URL for error parameters from Supabase
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      setError(errorDescription || errorParam);
      setStatus('error');
      return;
    }

    const inviteId = params.get('invite');

    // If authenticated, handle invite or redirect
    if (isAuthenticated && user) {
      // Handle invite acceptance
      if (inviteId && !inviteProcessedRef.current) {
        inviteProcessedRef.current = true;
        setStatus('accepting_invite');
        acceptInvite(inviteId, user.id);
      } else if (!inviteId) {
        // No invite, just redirect
        setStatus('success');
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, user]);

  // Accept invite via RPC
  const acceptInvite = async (inviteId: string, userId: string) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('accept_org_invite', {
        p_invite_id: inviteId,
        p_user_id: userId,
      } as unknown as undefined);

      if (rpcError) {
        console.error('Failed to accept invite:', rpcError);
        // Don't show error to user - they might already be a member
        // Just redirect to home
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/?invite_accepted=true';
        }, 1000);
        return;
      }

      // Check the result
      const result = data as { success?: boolean } | null;
      if (result?.success) {
        setInviteAccepted(true);
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/?invite_accepted=true';
        }, 1500);
      } else {
        // Invite might be expired or already used
        console.warn('Invite acceptance returned:', data);
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      // Don't block user - redirect anyway
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  // Timeout - if auth doesn't complete in 15 seconds, something went wrong
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setError('Authentication timed out. Please try signing in again.');
        setStatus('error');
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [status]);

  if (status === 'error' && error) {
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

  if (status === 'success' && inviteAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Welcome to the team!</h2>
          <p className="text-text-secondary">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" />
        <p className="text-text-secondary">
          {status === 'accepting_invite' ? 'Joining organization...' : 'Confirming your account...'}
        </p>
      </div>
    </div>
  );
}
