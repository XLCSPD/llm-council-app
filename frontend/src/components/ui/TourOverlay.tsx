import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useHelpStore } from '@/store/helpStore';
import { tourSteps, getTourStepCount } from '@/features/help/content/tourSteps';

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const {
    tourActive,
    currentTourStep,
    nextStep,
    previousStep,
    completeTour,
    dismissTour,
  } = useHelpStore();

  const [spotlight, setSpotlight] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = tourSteps[currentTourStep];
  const totalSteps = getTourStepCount();
  const isLastStep = currentTourStep === totalSteps - 1;
  const isFirstStep = currentTourStep === 0;

  // Calculate spotlight and tooltip positions
  const updatePositions = useCallback(() => {
    if (!currentStep) return;

    const targetElement = document.querySelector(`[data-tour="${currentStep.target}"]`);

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const padding = currentStep.highlightPadding || 4;

      // Set spotlight position
      setSpotlight({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate tooltip position based on placement
      const tooltipWidth = 320;
      const tooltipHeight = 180; // Approximate
      const offset = 16;

      let tooltipTop = 0;
      let tooltipLeft = 0;

      switch (currentStep.placement) {
        case 'top':
          tooltipTop = rect.top - tooltipHeight - offset;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          tooltipTop = rect.bottom + offset;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.left - tooltipWidth - offset;
          break;
        case 'right':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.right + offset;
          break;
      }

      // Keep tooltip within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      tooltipLeft = Math.max(16, Math.min(tooltipLeft, viewportWidth - tooltipWidth - 16));
      tooltipTop = Math.max(16, Math.min(tooltipTop, viewportHeight - tooltipHeight - 16));

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
    } else {
      // If target not found, center the tooltip
      setSpotlight(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 90,
        left: window.innerWidth / 2 - 160,
      });
    }
  }, [currentStep]);

  // Update positions on step change and resize
  useEffect(() => {
    if (!tourActive) return;

    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [tourActive, currentTourStep, updatePositions]);

  // Keyboard navigation
  useEffect(() => {
    if (!tourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (isLastStep) {
            completeTour();
          } else {
            nextStep();
          }
          break;
        case 'ArrowLeft':
          if (!isFirstStep) {
            previousStep();
          }
          break;
        case 'Escape':
          dismissTour();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourActive, isLastStep, isFirstStep, nextStep, previousStep, completeTour, dismissTour]);

  if (!tourActive || !currentStep) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
        {/* Semi-transparent overlay with spotlight cutout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
          onClick={dismissTour}
        />

        {/* Spotlight highlight */}
        {spotlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              borderRadius: '8px',
              border: '2px solid var(--color-accent-primary)',
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute w-80 bg-white dark:bg-bg-secondary border border-gray-200 dark:border-border rounded-xl shadow-2xl overflow-hidden"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-border bg-gray-50 dark:bg-bg-tertiary/50">
            <span className="text-xs text-gray-500 dark:text-text-muted font-medium">
              Step {currentTourStep + 1} of {totalSteps}
            </span>
            <button
              onClick={dismissTour}
              className="p-1 rounded-md text-gray-400 dark:text-text-muted hover:text-gray-600 dark:hover:text-text-primary hover:bg-gray-100 dark:hover:bg-bg-tertiary transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-text-primary mb-2">
              {currentStep.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
              {currentStep.content}
            </p>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-2">
            <div className="h-1 bg-gray-200 dark:bg-bg-tertiary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentTourStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-border bg-gray-50/50 dark:bg-bg-tertiary/30">
            <button
              onClick={dismissTour}
              className="text-xs text-gray-500 dark:text-text-muted hover:text-gray-700 dark:hover:text-text-secondary transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={previousStep}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-text-secondary hover:text-gray-900 dark:hover:text-text-primary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={isLastStep ? completeTour : nextStep}
                className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
              >
                {isLastStep ? (
                  'Finish'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
