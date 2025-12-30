// Components
export { HelpPage } from './components/HelpPage';
export { HelpSidebar } from './components/HelpSidebar';
export { HelpSection } from './components/HelpSection';

// Hooks
export { useTour } from './hooks/useTour';

// Content
export { helpSections } from './content/helpContent';
export type { HelpSection as HelpSectionType, HelpContentBlock } from './content/helpContent';
export { tooltipContent, getTooltip } from './content/tooltipContent';
export type { TooltipContent } from './content/tooltipContent';
export { tourSteps, getTourStepCount, getTourStep, getTourStepIndex } from './content/tourSteps';
export type { TourStep } from './content/tourSteps';
