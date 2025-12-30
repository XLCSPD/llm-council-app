import { useEffect, useCallback } from 'react';
import { useHelpStore } from '@/store/helpStore';
import { useUIStore } from '@/store/uiStore';
import { useSessionStore } from '@/store/sessionStore';
import { tourSteps, getTourStepCount } from '../content/tourSteps';
import type { PhaseType } from '@/types';

interface UseTourReturn {
  // State
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  stepData: (typeof tourSteps)[number] | undefined;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;

  // Actions
  start: () => void;
  next: () => void;
  previous: () => void;
  skip: () => void;
  complete: () => void;
  reset: () => void;
}

export function useTour(): UseTourReturn {
  const {
    tourActive,
    currentTourStep,
    startTour,
    nextStep,
    previousStep,
    completeTour,
    dismissTour,
    resetTour,
  } = useHelpStore();

  const { setCurrentView, currentView } = useUIStore();
  const { setCurrentPhase, currentPhase } = useSessionStore();

  const totalSteps = getTourStepCount();
  const stepData = tourSteps[currentTourStep];
  const progress = totalSteps > 0 ? ((currentTourStep + 1) / totalSteps) * 100 : 0;
  const isFirstStep = currentTourStep === 0;
  const isLastStep = currentTourStep === totalSteps - 1;

  // Auto-navigate to required view/phase when step changes
  useEffect(() => {
    if (!tourActive || !stepData) return;

    // Navigate to required view if specified
    if (stepData.requiredView && currentView !== stepData.requiredView) {
      setCurrentView(stepData.requiredView);
    }

    // Navigate to required phase if specified
    if (stepData.requiredPhase && currentPhase !== stepData.requiredPhase) {
      setCurrentPhase(stepData.requiredPhase as PhaseType);
    }
  }, [tourActive, currentTourStep, stepData, currentView, currentPhase, setCurrentView, setCurrentPhase]);

  // Start tour with navigation to setup
  const start = useCallback(() => {
    // Ensure we're on the deliberation view and setup phase
    setCurrentView('deliberation');
    setCurrentPhase('setup');
    startTour();
  }, [startTour, setCurrentView, setCurrentPhase]);

  // Navigate to next step
  const next = useCallback(() => {
    if (isLastStep) {
      completeTour();
    } else {
      nextStep();
    }
  }, [isLastStep, nextStep, completeTour]);

  // Navigate to previous step
  const previous = useCallback(() => {
    if (!isFirstStep) {
      previousStep();
    }
  }, [isFirstStep, previousStep]);

  // Skip/dismiss the tour
  const skip = useCallback(() => {
    dismissTour();
  }, [dismissTour]);

  // Complete the tour
  const complete = useCallback(() => {
    completeTour();
  }, [completeTour]);

  // Reset and restart tour
  const reset = useCallback(() => {
    resetTour();
  }, [resetTour]);

  return {
    isActive: tourActive,
    currentStep: currentTourStep,
    totalSteps,
    stepData,
    progress,
    isFirstStep,
    isLastStep,
    start,
    next,
    previous,
    skip,
    complete,
    reset,
  };
}
