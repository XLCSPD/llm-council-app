export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'decision' | 'problem' | 'analysis' | 'strategy' | 'creative';
  icon: string;
  template: {
    content: string;
    objective: string;
    constraints: string[];
    audience?: string;
    context?: string;
  };
  placeholders: { key: string; label: string; example: string }[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'binary-decision',
    name: 'Binary Decision',
    description: 'Help choose between two options',
    category: 'decision',
    icon: 'Scale',
    template: {
      content: 'Should I {option_a} or {option_b}? Consider the {context} and help me make an informed decision.',
      objective: 'Provide a clear recommendation with supporting reasoning',
      constraints: [
        'Consider both short-term and long-term implications',
        'Identify potential risks for each option',
        'Account for the given context and constraints',
      ],
    },
    placeholders: [
      { key: 'option_a', label: 'Option A', example: 'take the new job offer' },
      { key: 'option_b', label: 'Option B', example: 'stay at my current position' },
      { key: 'context', label: 'Context', example: 'current economic climate and career goals' },
    ],
  },
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    description: 'Find solutions to a specific problem',
    category: 'problem',
    icon: 'Lightbulb',
    template: {
      content: 'How can we solve the problem of {problem}? We are currently facing {situation}.',
      objective: 'Identify actionable solutions with implementation steps',
      constraints: [
        '{constraint_1}',
        'Solution must be practical and implementable',
        'Consider resource limitations',
      ],
    },
    placeholders: [
      { key: 'problem', label: 'Problem', example: 'low team productivity' },
      { key: 'situation', label: 'Current Situation', example: 'remote work challenges and unclear priorities' },
      { key: 'constraint_1', label: 'Key Constraint', example: 'Limited budget for new tools' },
    ],
  },
  {
    id: 'brainstorming',
    name: 'Brainstorming',
    description: 'Generate creative ideas on a topic',
    category: 'creative',
    icon: 'Sparkles',
    template: {
      content: 'Generate innovative ideas for {topic}. The goal is to {goal}.',
      objective: 'Produce diverse, creative ideas with varying levels of feasibility',
      constraints: [
        'Include both conventional and unconventional ideas',
        'Consider {audience} as the target audience',
        'Prioritize ideas that can be implemented quickly',
      ],
    },
    placeholders: [
      { key: 'topic', label: 'Topic', example: 'improving customer onboarding experience' },
      { key: 'goal', label: 'Goal', example: 'reduce time-to-value for new users' },
      { key: 'audience', label: 'Target Audience', example: 'B2B SaaS customers' },
    ],
  },
  {
    id: 'pros-cons',
    name: 'Pros & Cons Analysis',
    description: 'Analyze advantages and disadvantages',
    category: 'analysis',
    icon: 'ListChecks',
    template: {
      content: 'Analyze the advantages and disadvantages of {subject}. Consider the perspective of {stakeholder}.',
      objective: 'Provide a balanced analysis with weighted importance of each factor',
      constraints: [
        'Include at least 5 pros and 5 cons',
        'Rank factors by importance',
        'Consider hidden or non-obvious factors',
      ],
    },
    placeholders: [
      { key: 'subject', label: 'Subject', example: 'adopting a microservices architecture' },
      { key: 'stakeholder', label: 'Stakeholder', example: 'a startup CTO' },
    ],
  },
  {
    id: 'strategy-planning',
    name: 'Strategic Approach',
    description: 'Plan the best approach to achieve a goal',
    category: 'strategy',
    icon: 'Target',
    template: {
      content: "What's the best approach to achieve {goal}? Current state: {current_state}. Target timeline: {timeline}.",
      objective: 'Develop a phased strategic plan with milestones',
      constraints: [
        'Plan must be actionable with clear next steps',
        'Include contingency plans for risks',
        'Consider resource constraints',
      ],
    },
    placeholders: [
      { key: 'goal', label: 'Goal', example: 'launch a new product line' },
      { key: 'current_state', label: 'Current State', example: 'initial prototypes completed, seeking market validation' },
      { key: 'timeline', label: 'Timeline', example: '6 months' },
    ],
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    description: 'Evaluate risks and mitigation strategies',
    category: 'analysis',
    icon: 'AlertTriangle',
    template: {
      content: 'Assess the risks associated with {action}. Context: {context}.',
      objective: 'Identify, categorize, and prioritize risks with mitigation strategies',
      constraints: [
        'Categorize risks by likelihood and impact',
        'Propose mitigation strategies for top risks',
        'Consider both direct and indirect risks',
      ],
    },
    placeholders: [
      { key: 'action', label: 'Action/Decision', example: 'expanding into the European market' },
      { key: 'context', label: 'Context', example: 'we are a US-based SaaS company with no international experience' },
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: 'Grid' },
  { id: 'decision', label: 'Decision Making', icon: 'Scale' },
  { id: 'problem', label: 'Problem Solving', icon: 'Lightbulb' },
  { id: 'analysis', label: 'Analysis', icon: 'BarChart' },
  { id: 'strategy', label: 'Strategy', icon: 'Target' },
  { id: 'creative', label: 'Creative', icon: 'Sparkles' },
];

export function fillTemplate(template: PromptTemplate, values: Record<string, string>): PromptTemplate['template'] {
  let content = template.template.content;
  let objective = template.template.objective;
  let constraints = [...template.template.constraints];

  // Replace placeholders in content
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    content = content.replace(regex, value || `[${key}]`);
    objective = objective.replace(regex, value || `[${key}]`);
    constraints = constraints.map(c => c.replace(regex, value || `[${key}]`));
  }

  return {
    content,
    objective,
    constraints,
    audience: template.template.audience,
    context: template.template.context,
  };
}
