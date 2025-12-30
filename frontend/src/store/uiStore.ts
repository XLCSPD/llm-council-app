import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type ViewMode = 'deliberation' | 'settings' | 'help';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UIState {
  theme: Theme;
  currentView: ViewMode;
  sidebarOpen: boolean;
  expandedCards: Set<string>;
  toasts: Toast[];

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setCurrentView: (view: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCardExpansion: (cardId: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// Get initial theme from system preference
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem('ui-store');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.theme) return parsed.state.theme;
    } catch {
      // Ignore parse errors
    }
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      currentView: 'deliberation' as ViewMode,
      sidebarOpen: true,
      expandedCards: new Set<string>(),
      toasts: [],

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        set({ theme: newTheme });
      },

      setTheme: (theme: Theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },

      setCurrentView: (view: ViewMode) => set({ currentView: view }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      toggleCardExpansion: (cardId: string) => {
        set((state) => {
          const newSet = new Set(state.expandedCards);
          if (newSet.has(cardId)) {
            newSet.delete(cardId);
          } else {
            newSet.add(cardId);
          }
          return { expandedCards: newSet };
        });
      },

      addToast: (toast) => {
        const id = crypto.randomUUID();
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));
        // Auto-remove after 5 seconds
        setTimeout(() => {
          get().removeToast(id);
        }, 5000);
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        currentView: state.currentView,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Apply theme on load
if (typeof window !== 'undefined') {
  const theme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', theme);
}
