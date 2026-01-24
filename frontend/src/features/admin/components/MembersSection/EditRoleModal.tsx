/**
 * EditRoleModal - Modal for changing member roles
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, User, Loader2 } from 'lucide-react';
import type { DetailedMember, MemberRole } from '../../types';

interface EditRoleModalProps {
  member: DetailedMember | null;
  bulkCount?: number;
  onClose: () => void;
  onSave: (memberId: string, role: MemberRole) => void | Promise<void>;
  loading?: boolean;
}

export function EditRoleModal({
  member,
  bulkCount,
  onClose,
  onSave,
  loading = false,
}: EditRoleModalProps) {
  const isBulk = bulkCount !== undefined && bulkCount > 0;
  const [selectedRole, setSelectedRole] = useState<MemberRole>(
    isBulk ? 'member' : (member?.role as MemberRole) || 'member'
  );

  const handleSave = async () => {
    if (isBulk) {
      await onSave('', selectedRole);
    } else if (member) {
      await onSave(member.id, selectedRole);
    }
  };

  const roles: { value: MemberRole; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Can manage team members and view analytics',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      value: 'member',
      label: 'Member',
      description: 'Can create and run council sessions',
      icon: <User className="w-4 h-4" />,
    },
  ];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="w-full max-w-md rounded-2xl bg-bg-secondary border border-glass-border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">
                {isBulk ? `Change Role for ${bulkCount} Members` : 'Change Role'}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member info (single mode only) */}
            {!isBulk && member && (
              <div className="mb-6 p-3 rounded-lg bg-bg-tertiary/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-medium">
                    {member.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {member.email}
                    </div>
                    <div className="text-xs text-text-muted">
                      Current role: {member.role}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Role selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-secondary">
                Select new role
              </label>
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === role.value
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-glass-border hover:border-text-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${
                          selectedRole === role.value
                            ? 'text-accent-primary'
                            : 'text-text-muted'
                        }`}
                      >
                        {role.icon}
                      </span>
                      <span className="font-medium text-text-primary">
                        {role.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || (!isBulk && selectedRole === member?.role)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-accent-primary hover:bg-accent-primary/80 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
