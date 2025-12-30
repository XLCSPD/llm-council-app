import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Plus,
  History,
  HelpCircle,
  Settings,
  MessageSquare,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { useSessionStore, useUIStore } from '@/store';
import type { SessionSummary } from '@/types';

interface MobileNavProps {
  onNewSession: () => void;
  onSelectSession: (session: SessionSummary) => void;
}

export function MobileNav({ onNewSession, onSelectSession }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { sessions, currentSession, removeSession } = useSessionStore();
  const { currentView, setCurrentView } = useUIStore();

  const handleClose = () => {
    setIsOpen(false);
    setShowHistory(false);
  };

  const handleNewSession = () => {
    setCurrentView('deliberation');
    onNewSession();
    handleClose();
  };

  const handleSelectSession = (session: SessionSummary) => {
    setCurrentView('deliberation');
    onSelectSession(session);
    handleClose();
  };

  const handleNavigation = (view: 'deliberation' | 'help' | 'settings') => {
    setCurrentView(view);
    handleClose();
  };

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-bg-secondary border border-border shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-text-primary" />
      </button>

      {/* Mobile Drawer */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="md:hidden fixed inset-0 bg-black/60 z-[100]"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="md:hidden fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] z-[101]
                         bg-bg-primary border-r border-border shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden">
                      <img src="/logo.png" alt="LLM Council" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-display font-semibold text-lg text-gradient">
                      LLM Council
                    </span>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {/* New Session Button */}
                  <button
                    onClick={handleNewSession}
                    className="w-full flex items-center gap-3 p-4 rounded-xl
                             bg-gradient-accent text-white font-medium
                             active:scale-[0.98] transition-transform"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Session</span>
                  </button>

                  {/* History Section */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl
                               text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50
                               active:bg-bg-tertiary transition-colors"
                    >
                      <History className="w-5 h-5" />
                      <span className="flex-1 text-left">History</span>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform ${showHistory ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {/* Session History List */}
                    <AnimatePresence>
                      {showHistory && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 ml-2 space-y-1 max-h-[40vh] overflow-y-auto">
                            {sessions.length === 0 ? (
                              <div className="text-sm text-text-muted py-4 px-3 text-center">
                                No sessions yet
                              </div>
                            ) : (
                              sessions.map((session) => (
                                <MobileSessionItem
                                  key={session.id}
                                  session={session}
                                  isActive={currentSession?.id === session.id}
                                  onClick={() => handleSelectSession(session)}
                                  onDelete={() => removeSession(session.id)}
                                />
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-border space-y-2">
                  <MobileNavItem
                    icon={<HelpCircle className="w-5 h-5" />}
                    label="Help"
                    isActive={currentView === 'help'}
                    onClick={() => handleNavigation('help')}
                  />
                  <MobileNavItem
                    icon={<Settings className="w-5 h-5" />}
                    label="Settings"
                    isActive={currentView === 'settings'}
                    onClick={() => handleNavigation('settings')}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

interface MobileNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function MobileNavItem({ icon, label, isActive, onClick }: MobileNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-4 rounded-xl
        transition-colors active:scale-[0.98]
        ${isActive
          ? 'bg-accent/10 text-accent'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface MobileSessionItemProps {
  session: SessionSummary;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function MobileSessionItem({ session, isActive, onClick, onDelete }: MobileSessionItemProps) {
  const statusColors = {
    draft: 'bg-text-muted',
    running: 'bg-accent animate-pulse',
    completed: 'bg-accent-success',
    failed: 'bg-accent-error',
  };

  return (
    <div
      className={`
        relative rounded-xl p-3 cursor-pointer transition-all
        active:scale-[0.98]
        ${isActive ? 'bg-accent/10 border border-accent/20' : 'hover:bg-bg-tertiary/50'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[session.status]}`}
            />
            <span className="text-sm font-medium text-text-primary truncate">
              {session.title || 'Untitled'}
            </span>
          </div>
          <div className="text-xs text-text-muted mt-1">
            {new Date(session.created_at).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg hover:bg-accent-error/10 transition-colors"
          aria-label="Delete session"
        >
          <Trash2 className="w-4 h-4 text-accent-error" />
        </button>
      </div>
    </div>
  );
}
