import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HelpState {
  // Tour state
  tourCompleted: boolean;
  tourActive: boolean;
  currentTourStep: number;
  tourDismissed: boolean;

  // Help page state
  activeSection: string;

  // Actions
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  completeTour: () => void;
  dismissTour: () => void;
  resetTour: () => void;
  setActiveSection: (section: string) => void;
}

export const useHelpStore = create<HelpState>()(
  persist(
    (set, get) => ({
      // Initial state
      tourCompleted: false,
      tourActive: false,
      currentTourStep: 0,
      tourDismissed: false,
      activeSection: 'getting-started',

      // Start the guided tour
      startTour: () => set({ tourActive: true, currentTourStep: 0 }),

      // Navigate to next tour step
      nextStep: () => {
        const { currentTourStep } = get();
        set({ currentTourStep: currentTourStep + 1 });
      },

      // Navigate to previous tour step
      previousStep: () => {
        const { currentTourStep } = get();
        if (currentTourStep > 0) {
          set({ currentTourStep: currentTourStep - 1 });
        }
      },

      // Mark tour as completed
      completeTour: () => set({
        tourActive: false,
        tourCompleted: true,
        currentTourStep: 0
      }),

      // Dismiss tour without completing
      dismissTour: () => set({
        tourActive: false,
        tourDismissed: true,
        currentTourStep: 0
      }),

      // Reset tour (allow user to restart)
      resetTour: () => set({
        tourCompleted: false,
        tourDismissed: false,
        tourActive: false,
        currentTourStep: 0
      }),

      // Set active help section
      setActiveSection: (section: string) => set({ activeSection: section }),
    }),
    {
      name: 'llm-council-help',
      partialize: (state) => ({
        tourCompleted: state.tourCompleted,
        tourDismissed: state.tourDismissed,
      }),
    }
  )
);
