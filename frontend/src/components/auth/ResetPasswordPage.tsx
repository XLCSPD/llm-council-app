import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Lock, Loader2, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function ResetPasswordPage() {
  const { updatePassword, isAuthenticated } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a valid recovery session
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    // When user clicks password reset link, Supabase sets a recovery session
    // The auth state change listener in authStore will have set isAuthenticated
    setHasRecoverySession(isAuthenticated);
  }, [isAuthenticated]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    const { error } = await updatePassword(password);

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setIsSuccess(true);
    }
  };

  // No recovery session - show error
  if (!hasRecoverySession) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">LLM Council</h1>
            <p className="text-text-secondary">Multi-agent AI deliberation platform</p>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">Invalid or Expired Link</h2>
              <p className="text-text-secondary mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-2.5 bg-accent text-white font-medium rounded-lg
                         hover:bg-accent/90 transition-colors"
              >
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">LLM Council</h1>
            <p className="text-text-secondary">Multi-agent AI deliberation platform</p>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-8">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">Password Updated</h2>
              <p className="text-text-secondary mb-6">
                Your password has been successfully updated. You can now use your new password to sign in.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-2.5 bg-accent text-white font-medium rounded-lg
                         hover:bg-accent/90 transition-colors"
              >
                Continue to App
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">LLM Council</h1>
          <p className="text-text-secondary">Multi-agent AI deliberation platform</p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-2 text-center">
            Set New Password
          </h2>
          <p className="text-text-secondary text-sm text-center mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-bg-primary
                           text-text-primary placeholder:text-text-muted
                           focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="text-xs text-yellow-500 mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg-primary
                           text-text-primary placeholder:text-text-muted
                           focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
                />
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white
                       font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
