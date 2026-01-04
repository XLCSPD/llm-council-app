/**
 * Model descriptions registry for tooltip display.
 * Provides beginner-friendly guidance on each AI model.
 */

export interface ModelDescription {
  /** Short 1-line summary */
  tagline: string;
  /** 2-3 sentence beginner-friendly explanation */
  description: string;
  /** Key use cases this model excels at */
  bestFor: string[];
}

/**
 * Get the description for a model by ID.
 * Returns undefined if model not found.
 */
export function getModelDescription(modelId: string): ModelDescription | undefined {
  return modelDescriptions[modelId];
}

/**
 * Model descriptions keyed by model ID.
 * Written for users who may not have AI experience.
 */
export const modelDescriptions: Record<string, ModelDescription> = {
  // OpenAI Models
  'openai/gpt-5.2': {
    tagline: "OpenAI's most advanced AI model",
    description: "The latest and most capable model from OpenAI. Exceptional at complex reasoning, creative writing, and nuanced analysis. Best choice when you need the highest quality responses.",
    bestFor: ['Complex decisions', 'Creative writing', 'Detailed analysis'],
  },
  'openai/gpt-5': {
    tagline: "OpenAI's flagship powerhouse",
    description: "A highly capable model that balances power with efficiency. Great for most tasks requiring deep thinking and comprehensive answers.",
    bestFor: ['General analysis', 'Problem solving', 'Long documents'],
  },
  'openai/gpt-5.1': {
    tagline: "Enhanced GPT-5 with improved reasoning",
    description: "An upgraded version of GPT-5 with better logical reasoning. Excellent for tasks that require step-by-step thinking and careful analysis.",
    bestFor: ['Logical reasoning', 'Step-by-step analysis', 'Technical tasks'],
  },
  'openai/gpt-5.2-chat': {
    tagline: "Optimized for dialogue and evaluation",
    description: "A specialized version of GPT-5.2 fine-tuned for conversational analysis and peer review. Excellent at evaluating and critiquing other responses with structured feedback.",
    bestFor: ['Peer review', 'Response evaluation', 'Structured critique'],
  },
  'openai/gpt-5.2-pro': {
    tagline: "Premium executive-tier synthesis",
    description: "OpenAI's most powerful model for high-stakes decision making. Designed for executives and critical decisions where quality matters more than cost. Exceptional synthesis capabilities.",
    bestFor: ['Executive decisions', 'High-stakes synthesis', 'Premium quality'],
  },
  'openai/gpt-5.1-codex-max': {
    tagline: "Deep code reasoning specialist",
    description: "Optimized for code analysis, architecture reviews, and complex refactoring decisions. Perfect as a synthesizer for technical councils discussing software challenges.",
    bestFor: ['Code analysis', 'Architecture review', 'Technical synthesis'],
  },
  'openai/gpt-5-mini': {
    tagline: "Fast and efficient OpenAI model",
    description: "A lighter version of GPT-5 that's quick and cost-effective. Perfect for straightforward tasks where speed matters more than maximum depth.",
    bestFor: ['Quick answers', 'Simple tasks', 'Budget-friendly councils'],
  },
  'openai/gpt-5-nano': {
    tagline: "Ultra-fast, ultra-affordable",
    description: "The smallest and fastest GPT-5 variant. Ideal for rapid responses on simple questions. Great as a devil's advocate to quickly challenge ideas.",
    bestFor: ['Instant responses', 'Simple questions', 'Cost savings'],
  },
  'openai/gpt-4o-mini': {
    tagline: "Reliable and affordable workhorse",
    description: "A well-tested, cost-effective model that handles most tasks competently. A reliable choice when you need good results without premium pricing.",
    bestFor: ['Everyday tasks', 'Budget councils', 'Reliable performance'],
  },
  'openai/gpt-4.1': {
    tagline: "Massive context, deep understanding",
    description: "Can process over 1 million words at once - perfect for analyzing very long documents or complex projects with lots of context. Premium pricing but unmatched context handling.",
    bestFor: ['Long documents', 'Complex projects', 'Research synthesis'],
  },
  'openai/gpt-4.1-mini': {
    tagline: "Big context, smaller price",
    description: "Handles very long documents like GPT-4.1 but at a fraction of the cost. Great balance when you need large context without premium pricing.",
    bestFor: ['Long documents', 'Document review', 'Cost-effective analysis'],
  },
  'openai/gpt-4.1-nano': {
    tagline: "Large context on a budget",
    description: "The most affordable way to analyze long documents. Good for quickly scanning large amounts of text when you don't need deep analysis.",
    bestFor: ['Document scanning', 'Quick summaries', 'Budget analysis'],
  },

  // Anthropic Models
  'anthropic/claude-opus-4.5': {
    tagline: "Anthropic's most thoughtful AI",
    description: "Known for careful, nuanced responses and exceptional at understanding complex instructions. Excels at tasks requiring deep thought and careful consideration.",
    bestFor: ['Nuanced analysis', 'Complex instructions', 'Thoughtful responses'],
  },
  'anthropic/claude-sonnet-4.5': {
    tagline: "Balanced power and efficiency",
    description: "Offers excellent reasoning capabilities with faster responses than Opus. A strong all-around choice for most deliberation tasks with massive context support.",
    bestFor: ['Balanced performance', 'Long context', 'General deliberation'],
  },
  'anthropic/claude-sonnet-4': {
    tagline: "Reliable Claude with huge context",
    description: "Can handle up to 1 million words of context while maintaining strong reasoning. Great for projects that need to reference extensive background information.",
    bestFor: ['Long documents', 'Reference-heavy tasks', 'Comprehensive analysis'],
  },
  'anthropic/claude-haiku-4.5': {
    tagline: "Quick and capable Claude",
    description: "Fast responses while still maintaining Claude's thoughtful approach. Perfect when you need speed without sacrificing too much depth.",
    bestFor: ['Fast responses', 'Moderate complexity', 'Cost-effective'],
  },
  'anthropic/claude-3.7-sonnet': {
    tagline: "Proven performer with hybrid reasoning",
    description: "A well-established model known for balanced, well-reasoned responses. Offers extended thinking capabilities for complex problems.",
    bestFor: ['Complex reasoning', 'Balanced analysis', 'Extended thinking'],
  },
  'anthropic/claude-3.5-sonnet': {
    tagline: "Battle-tested and reliable",
    description: "One of the most widely-used AI models, proven across millions of conversations. Reliable choice when you need consistent, high-quality results.",
    bestFor: ['Proven reliability', 'Consistent quality', 'General tasks'],
  },
  'anthropic/claude-3.5-haiku': {
    tagline: "Fast and affordable Claude",
    description: "Quick responses at a low cost while maintaining Claude's characteristic thoughtfulness. Great for simpler tasks or as a supporting council member.",
    bestFor: ['Quick tasks', 'Budget-friendly', 'Supporting role'],
  },

  // Google Models
  'google/gemini-2.5-flash': {
    tagline: "Google's speed champion",
    description: "Optimized for rapid responses with Google's latest AI technology. Handles huge documents efficiently and offers excellent value for most tasks.",
    bestFor: ['Fast responses', 'Large documents', 'Value for money'],
  },
  'google/gemini-2.0-flash-001': {
    tagline: "Ultra-fast at minimal cost",
    description: "Google's most economical model that still delivers quality results. Perfect for quick analyses or when running many deliberations.",
    bestFor: ['High volume', 'Quick scans', 'Minimal cost'],
  },
  'google/gemini-2.5-pro': {
    tagline: "Google's premium thinker",
    description: "Google's most capable model with massive context support. Excellent for complex reasoning and can process enormous amounts of information at once.",
    bestFor: ['Complex reasoning', 'Massive context', 'Premium quality'],
  },
  'google/gemini-3-pro-preview': {
    tagline: "Next-gen Google AI with 1M+ context",
    description: "Google's latest flagship model with exceptional long-context understanding. Preview access to cutting-edge capabilities for comprehensive analysis and synthesis.",
    bestFor: ['Long-context analysis', 'Comprehensive review', 'Cutting-edge AI'],
  },

  // xAI Grok Models
  'x-ai/grok-3-mini': {
    tagline: "Grok's quick-witted assistant",
    description: "A fast, direct model that's not afraid to take unconventional positions. Great as a devil's advocate to challenge groupthink in your council.",
    bestFor: ["Devil's advocate", 'Alternative views', 'Quick responses'],
  },
  'x-ai/grok-4-fast': {
    tagline: "Ultra-fast with massive context",
    description: "Can process up to 2 million words with rapid response times. Ideal for analyzing very large documents quickly without waiting.",
    bestFor: ['Massive documents', 'Speed', 'Large context'],
  },
  'x-ai/grok-4.1-fast': {
    tagline: "Latest Grok with 2M token context",
    description: "The newest Grok model optimized for speed while maintaining quality. Excellent as a contrarian voice or devil's advocate with its unique perspective and huge context window.",
    bestFor: ['Huge context', 'Fast responses', "Devil's advocate"],
  },
  'x-ai/grok-code-fast-1': {
    tagline: "Lightning-fast code reasoning",
    description: "Specialized for rapid code analysis and programming discussions. Perfect for technical councils where you need quick code insights without sacrificing quality.",
    bestFor: ['Code review', 'Technical discussions', 'Fast code reasoning'],
  },

  // Meta Models
  'meta-llama/llama-3.3-70b-instruct': {
    tagline: "Open-source powerhouse",
    description: "A high-quality open model from Meta. Offers excellent reasoning at competitive pricing. Good for tasks where you want strong performance without premium costs.",
    bestFor: ['Good value', 'Strong reasoning', 'Alternative perspective'],
  },

  // DeepSeek Models
  'deepseek/deepseek-v3.2': {
    tagline: "Best-value reasoning specialist",
    description: "Known for efficient, focused responses with exceptional value. Strong reasoning capabilities at a fraction of premium model costs. Great for balanced councils.",
    bestFor: ['Value for money', 'Focused analysis', 'Balanced councils'],
  },
  'deepseek/deepseek-v3.2-exp': {
    tagline: "Experimental cutting-edge reasoning",
    description: "Preview access to DeepSeek's latest experimental features. Offers innovative reasoning approaches at minimal cost. Perfect for exploring new AI capabilities.",
    bestFor: ['Experimental features', 'Cost savings', 'Innovation'],
  },
  'deepseek/deepseek-v3.1-terminus': {
    tagline: "Sharp logic and critical analysis",
    description: "Optimized for critical evaluation and finding flaws in arguments. Exceptional at providing constructive criticism and identifying logical issues.",
    bestFor: ['Critical analysis', 'Finding flaws', 'Constructive criticism'],
  },
};
