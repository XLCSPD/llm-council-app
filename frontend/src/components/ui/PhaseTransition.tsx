import { ReactNode, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition } from '@/utils/motion';

interface PhaseTransitionProps {
  /** Unique key for the current phase (triggers animation on change) */
  phase: string;
  /** Content to render within the phase */
  children: ReactNode;
  /** Optional class name for the wrapper */
  className?: string;
}

/**
 * PhaseTransition
 *
 * Wraps phase content to provide smooth transitions between
 * deliberation phases. Moving between phases should feel
 * significant, like turning a page in an important discussion.
 *
 * Uses AnimatePresence with mode="wait" to ensure exit
 * animation completes before enter begins.
 */
export const PhaseTransition = memo(function PhaseTransition({
  phase,
  children,
  className = '',
}: PhaseTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});
