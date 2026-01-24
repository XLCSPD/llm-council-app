import type { Variants } from 'framer-motion';

/**
 * Motion design utilities for LLM Council
 *
 * These variants create orchestrated, polished animations
 * that give the deliberation process a ceremonial feel.
 */

// Custom easing curves
export const easings = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  spring: [0.16, 1, 0.3, 1],
  bounce: [0.34, 1.56, 0.64, 1],
} as const;

// Container that staggers its children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Faster stagger for lists
export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Fade in from below
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easings.smooth
    },
  },
};

// Fade in with scale
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easings.spring
    },
  },
};

// Slide in from left
export const slideInFromLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -30
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: easings.smooth
    },
  },
};

// Slide in from right
export const slideInFromRight: Variants = {
  hidden: {
    opacity: 0,
    x: 30
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: easings.smooth
    },
  },
};

// Card reveal with lift effect
export const cardReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easings.spring
    },
  },
};

// For model cards in reasoning phase - custom delay per index
export const modelCardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: easings.spring,
    },
  }),
};

// Phase transition animations
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    x: 50
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: easings.spring
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.3,
      ease: easings.smooth
    },
  },
};

// Command palette entry
export const modalReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    filter: 'blur(8px)'
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.2,
      ease: easings.spring
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    filter: 'blur(4px)',
    transition: {
      duration: 0.15
    },
  },
};

// For list items in command palette
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2
    },
  },
};

// Hover effects for interactive elements
export const hoverLift = {
  whileHover: {
    y: -2,
    transition: { duration: 0.2 }
  },
  whileTap: {
    y: 0,
    scale: 0.98
  },
};

// Pulse animation for active states
export const pulseGlow: Variants = {
  initial: {
    boxShadow: '0 0 20px rgba(13, 148, 136, 0.3)'
  },
  animate: {
    boxShadow: [
      '0 0 20px rgba(13, 148, 136, 0.3)',
      '0 0 40px rgba(94, 234, 212, 0.5)',
      '0 0 20px rgba(13, 148, 136, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    },
  },
};
