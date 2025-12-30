export interface TooltipContent {
  id: string;
  title: string;
  content: string;
  learnMoreSection?: string; // Optional link to help section
}

export const tooltipContent: Record<string, TooltipContent> = {
  // Council Setup
  'council-roles': {
    id: 'council-roles',
    title: 'Model Roles',
    content:
      'Each model can be assigned a role that influences how it approaches the question. Thinkers generate ideas, Critics evaluate assumptions, Devil\'s Advocates present opposing views, and Synthesizers integrate perspectives.',
    learnMoreSection: 'setup',
  },

  'model-weight': {
    id: 'model-weight',
    title: 'Model Weight',
    content:
      'Weight (0-1) determines how much influence this model has in the final synthesis. Higher weights mean more influence on the outcome.',
    learnMoreSection: 'setup',
  },

  'add-model': {
    id: 'add-model',
    title: 'Add Model',
    content:
      'Add AI models to your council. For diverse perspectives, consider mixing models from different providers (e.g., Claude + GPT).',
    learnMoreSection: 'setup',
  },

  // Prompt Creation
  'enhance-prompt': {
    id: 'enhance-prompt',
    title: 'Enhance with AI',
    content:
      'Uses AI to improve your prompt by making it clearer, more specific, and better structured for deliberation.',
    learnMoreSection: 'setup',
  },

  'prompt-objective': {
    id: 'prompt-objective',
    title: 'Objective Field',
    content:
      'Define what outcome you\'re looking for. This helps the council understand your goals and tailor their responses accordingly.',
    learnMoreSection: 'setup',
  },

  'prompt-context': {
    id: 'prompt-context',
    title: 'Context Field',
    content:
      'Provide background information that helps the council understand the situation. Include relevant details, constraints, or prior decisions.',
    learnMoreSection: 'setup',
  },

  'prompt-constraints': {
    id: 'prompt-constraints',
    title: 'Constraints Field',
    content:
      'Specify any limitations, requirements, or boundaries the council should consider in their deliberation.',
    learnMoreSection: 'setup',
  },

  // Reasoning Phase
  'reasoning-status': {
    id: 'reasoning-status',
    title: 'Response Status',
    content:
      'Shows the current state of each model\'s response: Pending (queued), Running (generating), Succeeded (complete), or Failed (error).',
    learnMoreSection: 'reasoning',
  },

  'parallel-execution': {
    id: 'parallel-execution',
    title: 'Parallel Execution',
    content:
      'All models generate responses simultaneously for faster results. Each model works independently without seeing others\' responses.',
    learnMoreSection: 'reasoning',
  },

  // Review Phase
  'rankings-matrix': {
    id: 'rankings-matrix',
    title: 'Rankings Matrix',
    content:
      'Shows peer review scores in a grid. Rows are responses being reviewed, columns are reviewers. Click any cell to see the detailed rationale.',
    learnMoreSection: 'review',
  },

  'peer-review-score': {
    id: 'peer-review-score',
    title: 'Peer Review Score',
    content:
      'Each model scores other models\' responses on a 0-10 scale based on quality, reasoning, and relevance to the question.',
    learnMoreSection: 'review',
  },

  'score-distribution': {
    id: 'score-distribution',
    title: 'Score Distribution',
    content:
      'Visual breakdown of how scores are distributed. High agreement suggests consensus; wide variation may indicate multiple valid perspectives.',
    learnMoreSection: 'review',
  },

  // Synthesis Phase
  'confidence-level': {
    id: 'confidence-level',
    title: 'Confidence Level',
    content:
      'Indicates how certain the council is about the synthesis. High (80-100%): strong consensus. Medium (50-79%): general agreement. Low (0-49%): significant disagreement.',
    learnMoreSection: 'synthesis',
  },

  'key-agreements': {
    id: 'key-agreements',
    title: 'Key Agreements',
    content:
      'Points where council members reached consensus. These represent the most reliable conclusions from the deliberation.',
    learnMoreSection: 'synthesis',
  },

  'key-disagreements': {
    id: 'key-disagreements',
    title: 'Key Disagreements',
    content:
      'Areas where council members had differing opinions. Understanding disagreements helps identify where more research or discussion may be needed.',
    learnMoreSection: 'synthesis',
  },

  'minority-opinions': {
    id: 'minority-opinions',
    title: 'Minority Opinions',
    content:
      'Important dissenting viewpoints that didn\'t reach consensus but may contain valuable insights worth considering.',
    learnMoreSection: 'synthesis',
  },

  'export-pdf': {
    id: 'export-pdf',
    title: 'Export PDF',
    content:
      'Generate a comprehensive PDF report containing your prompt, all reasoning responses, peer reviews, and the final synthesis.',
    learnMoreSection: 'synthesis',
  },

  // Session Management
  'new-session': {
    id: 'new-session',
    title: 'New Session',
    content:
      'Start a fresh deliberation session. Your current prompt and council configuration will be cleared.',
  },

  'session-history': {
    id: 'session-history',
    title: 'Session History',
    content:
      'Access your previous deliberation sessions. You can review past results or continue where you left off.',
  },
};

// Helper function to get tooltip by ID
export const getTooltip = (id: string): TooltipContent | undefined => {
  return tooltipContent[id];
};
