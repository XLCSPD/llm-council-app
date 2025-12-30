export interface TourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  requiredView?: 'deliberation' | 'settings' | 'help';
  requiredPhase?: 'setup' | 'reasoning' | 'review' | 'synthesis';
  highlightPadding?: number;
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: 'sidebar-logo',
    title: 'Welcome to LLM Council!',
    content:
      'This guided tour will show you how to use the multi-agent AI deliberation platform. Let\'s get started!',
    placement: 'right',
    requiredView: 'deliberation',
  },
  {
    id: 'prompt-input',
    target: 'prompt-input',
    title: 'Enter Your Question',
    content:
      'Start by typing your question or topic here. This is what the AI council will deliberate on. Be specific for best results.',
    placement: 'bottom',
    requiredView: 'deliberation',
    requiredPhase: 'setup',
  },
  {
    id: 'prompt-fields',
    target: 'prompt-fields',
    title: 'Additional Context',
    content:
      'Expand this section to add objectives, context, and constraints. These optional fields help the council understand your needs better.',
    placement: 'bottom',
    requiredView: 'deliberation',
    requiredPhase: 'setup',
  },
  {
    id: 'enhance-button',
    target: 'enhance-button',
    title: 'AI Enhancement',
    content:
      'Click here to have AI improve your prompt. It will make your question clearer and more structured for better deliberation.',
    placement: 'left',
    requiredView: 'deliberation',
    requiredPhase: 'setup',
  },
  {
    id: 'model-selector',
    target: 'model-selector',
    title: 'Build Your Council',
    content:
      'Add AI models to form your council. Click "Add Model" to select from available models. You need at least 2 models to start.',
    placement: 'top',
    requiredView: 'deliberation',
    requiredPhase: 'setup',
    highlightPadding: 8,
  },
  {
    id: 'role-selector',
    target: 'role-selector',
    title: 'Assign Roles',
    content:
      'Each model can have a role: Thinker (generates ideas), Critic (evaluates), Devil\'s Advocate (challenges), or Synthesizer (integrates).',
    placement: 'left',
    requiredView: 'deliberation',
    requiredPhase: 'setup',
  },
  {
    id: 'model-weight',
    target: 'model-weight',
    title: 'Set Model Weight',
    content:
      'Adjust the weight slider to control how much influence this model has in the final synthesis. Higher weight = more influence.',
    placement: 'left',
    requiredView: 'deliberation',
    requiredPhase: 'setup',
  },
  {
    id: 'start-button',
    target: 'start-button',
    title: 'Start Deliberation',
    content:
      'Once you have your prompt and at least 2 models, click here to begin! The council will go through reasoning, review, and synthesis phases.',
    placement: 'top',
    requiredView: 'deliberation',
    requiredPhase: 'setup',
    highlightPadding: 12,
  },
  {
    id: 'phase-tabs',
    target: 'phase-tabs',
    title: 'Deliberation Phases',
    content:
      'Track progress through the four phases: Setup, Reasoning (models respond), Review (peer evaluation), and Synthesis (final answer).',
    placement: 'bottom',
    requiredView: 'deliberation',
  },
  {
    id: 'sidebar-help',
    target: 'sidebar-help',
    title: 'Need Help?',
    content:
      'Click here anytime to access detailed guides for each phase. You can also restart this tour from the Help page.',
    placement: 'right',
    requiredView: 'deliberation',
  },
  {
    id: 'tour-complete',
    target: 'sidebar-logo',
    title: 'You\'re Ready!',
    content:
      'That\'s the basics! Start by entering a question and adding models to your council. Happy deliberating!',
    placement: 'right',
    requiredView: 'deliberation',
  },
];

// Get total number of tour steps
export const getTourStepCount = (): number => tourSteps.length;

// Get a specific tour step by index
export const getTourStep = (index: number): TourStep | undefined => {
  return tourSteps[index];
};

// Get step index by ID
export const getTourStepIndex = (id: string): number => {
  return tourSteps.findIndex((step) => step.id === id);
};
