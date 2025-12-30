import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Mail, Loader2, CheckCircle, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'signup';
type AuthMethod = 'password' | 'magic-link';

export function LoginPage() {
  const { signInWithMagicLink, signUp, signInWithPassword, resetPassword } = useAuthStore();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const validateSignup = (): string | null => {
    const pwdError = validatePassword(password);
    if (pwdError) return pwdError;
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (authMethod === 'magic-link') {
        // Magic link flow
        const { error } = await signInWithMagicLink(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage(`We've sent a magic link to ${email}. Check your email to sign in.`);
        }
      } else if (authMode === 'signup') {
        // Signup with password
        const validationError = validateSignup();
        if (validationError) {
          setError(validationError);
          setIsSubmitting(false);
          return;
        }

        const { error, needsEmailVerification } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else if (needsEmailVerification) {
          setSuccessMessage(`Account created! Check ${email} for a verification link.`);
        }
        // If no verification needed, auth state change listener will handle redirect
      } else {
        // Login with password
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setError(error.message);
        }
        // Success is handled by auth state change listener
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const { error } = await resetPassword(email);
    setIsSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage(`Password reset link sent to ${email}`);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  // Show success message screen
  if (successMessage) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4">
              <img src="/logo.png" alt="LLM Council" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">LLM Council</h1>
            <p className="text-text-secondary">Multi-agent AI deliberation platform</p>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-8">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">Check your email</h2>
              <p className="text-text-secondary mb-6">{successMessage}</p>
              <button
                onClick={() => {
                  resetForm();
                  setSuccessMessage(null);
                }}
                className="text-accent hover:text-accent/80 text-sm"
              >
                Use a different email
              </button>
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
          <div className="w-24 h-24 mx-auto mb-4">
            <img src="/logo.png" alt="LLM Council" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">LLM Council</h1>
          <p className="text-text-secondary">Multi-agent AI deliberation platform</p>
        </div>

        {/* Auth Card */}
        <div className="bg-bg-secondary border border-border rounded-xl p-8">
          {/* Auth Mode Tabs */}
          <div className="flex gap-1 p-1 bg-bg-tertiary rounded-lg mb-6">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                authMode === 'login'
                  ? 'bg-bg-secondary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                authMode === 'signup'
                  ? 'bg-bg-secondary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg-primary
                           text-text-primary placeholder:text-text-muted
                           focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-colors"
                />
              </div>
            </div>

            {/* Password Fields (only for password method) */}
            {authMethod === 'password' && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                    Password
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
                  {authMode === 'signup' && password.length > 0 && password.length < 6 && (
                    <p className="text-xs text-yellow-500 mt-1">Password must be at least 6 characters</p>
                  )}
                </div>

                {/* Confirm Password (signup only) */}
                {authMode === 'signup' && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1.5">
                      Confirm Password
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
                )}

                {/* Forgot Password (login only) */}
                {authMode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-accent hover:text-accent/80"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !email || (authMethod === 'password' && !password)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white
                       font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {authMethod === 'magic-link' ? 'Sending link...' :
                   authMode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : authMethod === 'magic-link' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Send magic link
                </>
              ) : authMode === 'signup' ? (
                <>
                  <Lock className="w-4 h-4" />
                  Create Account
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Auth Method Toggle */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={() => setAuthMethod(authMethod === 'password' ? 'magic-link' : 'password')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                       text-text-secondary hover:text-text-primary border border-border rounded-lg
                       hover:bg-bg-tertiary transition-colors text-sm"
            >
              {authMethod === 'password' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Use magic link instead
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Use password instead
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
