/**
 * Decision Memory Feature
 *
 * Transform session history into a sophisticated decision memory system with:
 * - Command Palette (⌘K/Ctrl+K) for instant search and recall
 * - Enhanced Sidebar with Decision Cards and search
 * - Full Annotations (rating, notes, tags)
 * - Council Templates (save & reuse favorite configurations)
 * - Re-Run Actions (exact re-run, reuse council, reuse prompt)
 */

// Types
export * from './types';

// API
export * from './api';

// Components
export { CommandPalette } from './components/CommandPalette';
export {
  DecisionCard,
  searchResultToCardData,
  CouncilFingerprint,
  CouncilDots,
  OutcomeIndicators,
  StarRatingDisplay,
} from './components/DecisionCard';
export { SearchableSessionList } from './components/EnhancedSidebar';
export {
  AnnotationPanel,
  StarRating,
  TagSelector,
  NotesEditor,
} from './components/SessionAnnotations';
export {
  SaveCouncilModal,
  TemplateCard,
  TemplateSelector,
} from './components/CouncilTemplates';

// Hooks
export { useCommandPalette } from './hooks';
