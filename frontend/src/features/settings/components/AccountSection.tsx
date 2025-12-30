import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function AccountSection() {
  const { user, verifyCurrentPassword, updatePassword } = useAuthStore();

  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate new password length
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Prevent using same password
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsSubmitting(true);

    // Step 1: Verify current password
    const verifyResult = await verifyCurrentPassword(currentPassword);
    if (verifyResult.error) {
      setIsSubmitting(false);
      setError('Current password is incorrect');
      return;
    }

    // Step 2: Update to new password
    const updateResult = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (updateResult.error) {
      setError(updateResult.error.message);
    } else {
      setSuccess(true);
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const canSubmit = currentPassword && newPassword && confirmPassword && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* User email display */}
      <div className="flex items-center gap-3 pb-4 border-b border-glass-border">
        <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
          <span className="text-white font-medium">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-text-primary">Signed in as</div>
          <div className="text-sm text-text-secondary">{user?.email}</div>
        </div>
      </div>

      {/* Password change form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-medium text-text-secondary">Change Password</h3>

        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full pl-10 pr-10 py-3 rounded-xl glass-subtle
                       text-text-primary placeholder-text-muted
                       border border-glass-border focus:border-accent
                       focus:outline-none focus:ring-1 focus:ring-accent/50
                       transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                       text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-subtle
                       text-text-primary placeholder-text-muted
                       border border-glass-border focus:border-accent
                       focus:outline-none focus:ring-1 focus:ring-accent/50
                       transition-colors"
            />
          </div>
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="text-xs text-yellow-500 mt-1">
              Password must be at least 6 characters
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-subtle
                       text-text-primary placeholder-text-muted
                       border border-glass-border focus:border-accent
                       focus:outline-none focus:ring-1 focus:ring-accent/50
                       transition-colors"
            />
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-500">Password updated successfully</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${canSubmit
              ? 'bg-gradient-accent text-white hover:shadow-glow-cyan'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
            }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating password...
            </span>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
}
