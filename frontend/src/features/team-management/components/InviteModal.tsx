/**
 * InviteModal - Modal for sending team invites
 * Features email input with validation, role selector cards, and success animation
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Mail, Shield, AlertCircle, CheckCircle, Users, User } from 'lucide-react';
import { createInvite } from '../api/invites';
import type { Invite, InviteRole } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  userId: string;
  onInviteCreated: (invite: Invite) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteModal({
  isOpen,
  onClose,
  orgId,
  userId,
  onInviteCreated,
}: InviteModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('member');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValidEmail = EMAIL_REGEX.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const invite = await createInvite(
        { org_id: orgId, email: email.toLowerCase().trim(), role, name: name.trim() || undefined },
        userId
      );

      setSuccess(true);
      onInviteCreated(invite);

      // Reset and close after brief success animation
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to send invite:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setRole('member');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-teal-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-200">
                    Invite Team Member
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success State */}
              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </motion.div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">Invite Sent!</h3>
                  <p className="text-sm text-slate-400">
                    An invitation email has been sent to{' '}
                    <span className="text-slate-200 font-medium">
                      {name ? `${name} (${email})` : email}
                    </span>
                  </p>
                </motion.div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Name Input */}
                  <div>
                    <label
                      htmlFor="invite-name"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Name <span className="text-slate-500 text-xs font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="invite-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Their first name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl
                          bg-slate-700/50 border border-slate-600
                          text-slate-200 placeholder-slate-500
                          focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
                          transition-colors"
                        autoFocus
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="invite-email"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="invite-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        placeholder="colleague@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl
                          bg-slate-700/50 border border-slate-600
                          text-slate-200 placeholder-slate-500
                          focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
                          transition-colors"
                        autoComplete="email"
                      />
                    </div>
                    {email && !isValidEmail && (
                      <p className="text-xs text-yellow-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Please enter a valid email address
                      </p>
                    )}
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Role
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Member Role Card */}
                      <button
                        type="button"
                        onClick={() => setRole('member')}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                          role === 'member'
                            ? 'bg-teal-500/15 border-teal-500/50 ring-1 ring-teal-500/30'
                            : 'bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Shield className={`w-4 h-4 ${role === 'member' ? 'text-teal-400' : 'text-slate-400'}`} />
                          <span className="text-sm font-medium text-slate-200">Member</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Can create councils and view all sessions
                        </p>
                      </button>

                      {/* Admin Role Card */}
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                          role === 'admin'
                            ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30'
                            : 'bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Shield className={`w-4 h-4 ${role === 'admin' ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="text-sm font-medium text-slate-200">Admin</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Can also manage team members and invites
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium
                        text-slate-400 hover:text-slate-200 hover:bg-slate-700/50
                        transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSending || !email || !isValidEmail}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                        bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500
                        text-white shadow-lg shadow-teal-500/20
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-teal-600 disabled:hover:to-cyan-600
                        transition-all duration-200"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Invite
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
