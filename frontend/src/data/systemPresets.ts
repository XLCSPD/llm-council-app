/**
 * System council presets - predefined balanced council configurations.
 *
 * These presets provide opinionated, balanced starting points for common use cases.
 * All presets include at least one adversarial role (critic or devil's advocate).
 *
 * System presets are immutable and cannot be edited or deleted.
 */

import type { CouncilTemplate } from '@/features/decision-memory/types';

/**
 * System presets that ship with the app.
 * All presets are pre-balanced by design.
 */
export const SYSTEM_PRESETS: CouncilTemplate[] = [
  {
    id: 'system:fast',
    project_id: '', // System presets don't belong to a project
    name: 'Fast Brainstorm',
    description: 'Quick ideation with efficient models. Low cost, fast turnaround.',
    icon: 'zap',
    members: [
      {
        model_id: 'google/gemini-2.0-flash-001',
        display_name: 'Gemini 2.0 Flash',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'openai/gpt-4.1-nano',
        display_name: 'GPT-4.1 Nano',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'x-ai/grok-4-fast',
        display_name: 'Grok 4 Fast',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'openai/gpt-4.1-mini',
        display_name: 'GPT-4.1 Mini',
        role: 'critic',
        weight: 1.0,
        token_limit: null,
      },
    ],
    chairman_id: null,
    preset: 'fast',
    is_favorite: false,
    is_template: true,
    usage_count: 0,
    last_used_at: null,
    created_at: '',
    is_system: true,
  },
  {
    id: 'system:balanced',
    project_id: '',
    name: 'Decision Brief',
    description: 'Executive recommendations with balanced cost and quality.',
    icon: 'briefcase',
    members: [
      {
        model_id: 'anthropic/claude-sonnet-4',
        display_name: 'Claude Sonnet 4',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'openai/gpt-5',
        display_name: 'GPT-5',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'anthropic/claude-haiku-4.5',
        display_name: 'Claude Haiku 4.5',
        role: 'critic',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'anthropic/claude-sonnet-4.5',
        display_name: 'Claude Sonnet 4.5',
        role: 'synthesizer',
        weight: 1.0,
        token_limit: null,
      },
    ],
    chairman_id: null,
    preset: 'balanced',
    is_favorite: false,
    is_template: true,
    usage_count: 0,
    last_used_at: null,
    created_at: '',
    is_system: true,
  },
  {
    id: 'system:deep_analysis',
    project_id: '',
    name: 'Deep Analysis',
    description: 'Maximum rigor with premium models. Higher cost, thorough analysis.',
    icon: 'microscope',
    members: [
      {
        model_id: 'anthropic/claude-opus-4.5',
        display_name: 'Claude Opus 4.5',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'openai/gpt-5.2',
        display_name: 'GPT-5.2',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'google/gemini-2.5-pro',
        display_name: 'Gemini 2.5 Pro',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'x-ai/grok-3',
        display_name: 'Grok 3',
        role: 'devils_advocate',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'anthropic/claude-opus-4.5',
        display_name: 'Claude Opus 4.5 (Chair)',
        role: 'synthesizer',
        weight: 1.0,
        token_limit: null,
      },
    ],
    chairman_id: null,
    preset: 'deep_analysis',
    is_favorite: false,
    is_template: true,
    usage_count: 0,
    last_used_at: null,
    created_at: '',
    is_system: true,
  },
  {
    id: 'system:red_team',
    project_id: '',
    name: 'Red Team',
    description: 'Critique-first approach. Challenge assumptions and find weaknesses.',
    icon: 'shield-alert',
    members: [
      {
        model_id: 'anthropic/claude-sonnet-4.5',
        display_name: 'Claude Sonnet 4.5',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'openai/gpt-4.1',
        display_name: 'GPT-4.1',
        role: 'critic',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'x-ai/grok-3',
        display_name: 'Grok 3',
        role: 'critic',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'anthropic/claude-opus-4.5',
        display_name: 'Claude Opus 4.5 (Chair)',
        role: 'synthesizer',
        weight: 1.0,
        token_limit: null,
      },
    ],
    chairman_id: null,
    preset: 'executive',
    is_favorite: false,
    is_template: true,
    usage_count: 0,
    last_used_at: null,
    created_at: '',
    is_system: true,
  },
  {
    id: 'system:code_review',
    project_id: '',
    name: 'Code Review',
    description: 'Technical analysis for architecture and code review.',
    icon: 'code',
    members: [
      {
        model_id: 'anthropic/claude-sonnet-4.5',
        display_name: 'Claude Sonnet 4.5',
        role: 'thinker',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'deepseek/deepseek-v3.2',
        display_name: 'DeepSeek v3.2',
        role: 'critic',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'openai/gpt-4.1',
        display_name: 'GPT-4.1',
        role: 'critic',
        weight: 1.0,
        token_limit: null,
      },
      {
        model_id: 'anthropic/claude-opus-4.5',
        display_name: 'Claude Opus 4.5 (Chair)',
        role: 'synthesizer',
        weight: 1.0,
        token_limit: null,
      },
    ],
    chairman_id: null,
    preset: null,
    is_favorite: false,
    is_template: true,
    usage_count: 0,
    last_used_at: null,
    created_at: '',
    is_system: true,
  },
];

/**
 * Check if a template ID is a system preset.
 */
export function isSystemPreset(templateId: string): boolean {
  return templateId.startsWith('system:');
}

/**
 * Get a system preset by ID.
 */
export function getSystemPreset(presetId: string): CouncilTemplate | undefined {
  return SYSTEM_PRESETS.find((p) => p.id === presetId);
}
