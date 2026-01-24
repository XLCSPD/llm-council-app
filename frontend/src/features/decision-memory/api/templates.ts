/**
 * Decision Memory Council Templates API
 * CRUD operations for saving and reusing council configurations
 *
 * Note: Type assertions are used because the councils table has new columns
 * (icon, is_favorite, usage_count, last_used_at) that haven't been regenerated yet
 */

import { supabase } from '@/lib/supabase';
import type { CouncilTemplate, CouncilTemplateInput } from '../types';
import { SYSTEM_PRESETS, isSystemPreset } from '@/data/systemPresets';

// Helper to cast supabase table operations for new columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const councilsTable = () => supabase.from('councils') as any;

/**
 * Get all council templates for the current project
 * System presets are returned first, followed by user templates
 */
export async function getCouncilTemplates(
  projectId: string
): Promise<CouncilTemplate[]> {
  const { data, error } = await councilsTable()
    .select('*')
    .eq('project_id', projectId)
    .eq('is_template', true)
    .order('is_favorite', { ascending: false })
    .order('usage_count', { ascending: false })
    .order('name');

  if (error) {
    throw new Error(`Failed to get templates: ${error.message}`);
  }

  const userTemplates = (data || []).map(transformCouncilToTemplate);

  // Return system presets first, then user templates
  return [...SYSTEM_PRESETS, ...userTemplates];
}

/**
 * Get favorite templates
 */
export async function getFavoriteTemplates(
  projectId: string
): Promise<CouncilTemplate[]> {
  const { data, error } = await councilsTable()
    .select('*')
    .eq('project_id', projectId)
    .eq('is_template', true)
    .eq('is_favorite', true)
    .order('usage_count', { ascending: false });

  if (error) {
    throw new Error(`Failed to get favorite templates: ${error.message}`);
  }

  return (data || []).map(transformCouncilToTemplate);
}

/**
 * Get a single template by ID
 */
export async function getCouncilTemplate(
  templateId: string
): Promise<CouncilTemplate | null> {
  const { data, error } = await councilsTable()
    .select('*')
    .eq('id', templateId)
    .eq('is_template', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get template: ${error.message}`);
  }

  return transformCouncilToTemplate(data);
}

/**
 * Create a new council template
 */
export async function createCouncilTemplate(
  projectId: string,
  input: CouncilTemplateInput
): Promise<CouncilTemplate> {
  const { data, error } = await councilsTable()
    .insert({
      project_id: projectId,
      name: input.name,
      description: input.description || null,
      members: input.members,
      chairman_id: input.chairman_id || null,
      preset: input.preset || null,
      icon: input.icon || null,
      is_favorite: input.is_favorite || false,
      is_template: true,
      usage_count: 0,
      last_used_at: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return transformCouncilToTemplate(data);
}

/**
 * Update a council template
 * System presets cannot be edited
 */
export async function updateCouncilTemplate(
  templateId: string,
  input: Partial<CouncilTemplateInput>
): Promise<CouncilTemplate> {
  // Prevent editing of system presets
  if (isSystemPreset(templateId)) {
    throw new Error('Cannot edit system presets');
  }

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.members !== undefined) updateData.members = input.members;
  if (input.chairman_id !== undefined) updateData.chairman_id = input.chairman_id;
  if (input.preset !== undefined) updateData.preset = input.preset;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.is_favorite !== undefined) updateData.is_favorite = input.is_favorite;

  const { data, error } = await councilsTable()
    .update(updateData)
    .eq('id', templateId)
    .eq('is_template', true)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update template: ${error.message}`);
  }

  return transformCouncilToTemplate(data);
}

/**
 * Toggle favorite status
 * System presets cannot be favorited (they're always shown first)
 */
export async function toggleTemplateFavorite(
  templateId: string
): Promise<boolean> {
  // System presets cannot be favorited
  if (isSystemPreset(templateId)) {
    throw new Error('Cannot favorite system presets');
  }

  // Get current status
  const { data: current, error: getError } = await councilsTable()
    .select('is_favorite')
    .eq('id', templateId)
    .single();

  if (getError) {
    throw new Error(`Failed to get template: ${getError.message}`);
  }

  const newFavorite = !current.is_favorite;

  const { error: updateError } = await councilsTable()
    .update({ is_favorite: newFavorite })
    .eq('id', templateId);

  if (updateError) {
    throw new Error(`Failed to toggle favorite: ${updateError.message}`);
  }

  return newFavorite;
}

/**
 * Increment usage count and update last_used_at
 */
export async function recordTemplateUsage(templateId: string): Promise<void> {
  // Type assertion for RPC call
  const { error } = await (supabase.rpc as CallableFunction)('increment', {
    table_name: 'councils',
    row_id: templateId,
    column_name: 'usage_count',
    increment_by: 1,
  });

  // If the RPC doesn't exist, fall back to a manual update
  if (error) {
    const { data: current } = await councilsTable()
      .select('usage_count')
      .eq('id', templateId)
      .single();

    await councilsTable()
      .update({
        usage_count: (current?.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', templateId);
  }
}

/**
 * Delete a council template
 * System presets cannot be deleted
 */
export async function deleteCouncilTemplate(templateId: string): Promise<void> {
  // Prevent deletion of system presets
  if (isSystemPreset(templateId)) {
    throw new Error('Cannot delete system presets');
  }

  const { error } = await councilsTable()
    .delete()
    .eq('id', templateId)
    .eq('is_template', true);

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}

/**
 * Save current council config as a template
 */
export async function saveCouncilAsTemplate(
  projectId: string,
  councilConfig: {
    members: Array<{
      model_key: string;
      display_name: string;
      role: string;
      weight: number;
    }>;
  },
  name: string,
  description?: string,
  icon?: string
): Promise<CouncilTemplate> {
  const templateMembers = councilConfig.members.map((m) => ({
    model_id: m.model_key,
    role: m.role as 'thinker' | 'critic' | 'devils_advocate' | 'synthesizer',
    weight: m.weight,
    token_limit: null,
    display_name: m.display_name,
  }));

  return createCouncilTemplate(projectId, {
    name,
    description,
    members: templateMembers,
    icon,
    is_favorite: false,
  });
}

// =============================================================================
// HELPERS
// =============================================================================

interface DbCouncil {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  members: unknown;
  chairman_id: string | null;
  preset: string | null;
  icon: string | null;
  is_favorite: boolean | null;
  is_template: boolean | null;
  usage_count: number | null;
  last_used_at: string | null;
  created_at: string;
}

function transformCouncilToTemplate(data: DbCouncil): CouncilTemplate {
  return {
    id: data.id,
    project_id: data.project_id,
    name: data.name,
    description: data.description,
    members: (data.members as CouncilTemplate['members']) || [],
    chairman_id: data.chairman_id,
    preset: data.preset,
    icon: data.icon,
    is_favorite: data.is_favorite ?? false,
    is_template: data.is_template ?? false,
    usage_count: data.usage_count ?? 0,
    last_used_at: data.last_used_at,
    created_at: data.created_at,
  };
}
