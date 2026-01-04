/**
 * Decision Memory Annotations API
 * CRUD operations for session annotations (ratings, notes) and tags
 *
 * Note: Type assertions are used because these tables are newly added
 * and types haven't been regenerated yet
 */

import { supabase } from '@/lib/supabase';
import type {
  SessionAnnotation,
  SessionAnnotationInput,
  Tag,
  TagInput,
  TagSummary,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

// =============================================================================
// SESSION ANNOTATIONS
// =============================================================================

/**
 * Get annotation for a session
 */
export async function getSessionAnnotation(
  sessionId: string
): Promise<SessionAnnotation | null> {
  const { data, error } = await supabase
    .from('session_annotations')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - annotation doesn't exist yet
      return null;
    }
    throw new Error(`Failed to get annotation: ${error.message}`);
  }

  return data as SessionAnnotation;
}

/**
 * Create or update annotation for a session (upsert)
 */
export async function upsertSessionAnnotation(
  sessionId: string,
  input: SessionAnnotationInput
): Promise<SessionAnnotation> {
  const { data, error } = await (supabase
    .from('session_annotations') as AnyTable)
    .upsert(
      {
        session_id: sessionId,
        rating: input.rating,
        notes: input.notes,
      },
      {
        onConflict: 'session_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save annotation: ${error.message}`);
  }

  return data as SessionAnnotation;
}

/**
 * Update rating only
 */
export async function updateSessionRating(
  sessionId: string,
  rating: number | null
): Promise<void> {
  await upsertSessionAnnotation(sessionId, { rating });
}

/**
 * Update notes only
 */
export async function updateSessionNotes(
  sessionId: string,
  notes: string | null
): Promise<void> {
  await upsertSessionAnnotation(sessionId, { notes });
}

/**
 * Delete annotation for a session
 */
export async function deleteSessionAnnotation(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('session_annotations')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to delete annotation: ${error.message}`);
  }
}

// =============================================================================
// TAGS
// =============================================================================

/**
 * Get all tags for the current project
 */
export async function getProjectTags(projectId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('project_id', projectId)
    .order('name');

  if (error) {
    throw new Error(`Failed to get tags: ${error.message}`);
  }

  return (data || []) as Tag[];
}

/**
 * Create a new tag
 */
export async function createTag(
  projectId: string,
  input: TagInput
): Promise<Tag> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Must be authenticated to create tags');
  }

  const { data, error } = await (supabase
    .from('tags') as AnyTable)
    .insert({
      project_id: projectId,
      name: input.name,
      color: input.color || '#5eead4', // Default teal
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A tag with this name already exists');
    }
    throw new Error(`Failed to create tag: ${error.message}`);
  }

  return data as Tag;
}

/**
 * Update a tag
 */
export async function updateTag(
  tagId: string,
  input: Partial<TagInput>
): Promise<Tag> {
  const updateData: Record<string, string> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.color !== undefined) updateData.color = input.color;

  const { data, error } = await (supabase
    .from('tags') as AnyTable)
    .update(updateData)
    .eq('id', tagId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tag: ${error.message}`);
  }

  return data as Tag;
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', tagId);

  if (error) {
    throw new Error(`Failed to delete tag: ${error.message}`);
  }
}

// =============================================================================
// SESSION TAGS
// =============================================================================

/**
 * Get tags for a session
 */
export async function getSessionTags(sessionId: string): Promise<TagSummary[]> {
  const { data, error } = await (supabase
    .from('session_tags') as AnyTable)
    .select(`
      tag_id,
      tags (
        id,
        name,
        color
      )
    `)
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to get session tags: ${error.message}`);
  }

  interface SessionTagRow {
    tag_id: string;
    tags: { id: string; name: string; color: string } | { id: string; name: string; color: string }[];
  }

  return ((data || []) as SessionTagRow[]).map((st) => {
    const tag = Array.isArray(st.tags) ? st.tags[0] : st.tags;
    return {
      id: tag?.id || st.tag_id,
      name: tag?.name || 'Unknown',
      color: tag?.color || '#5eead4',
    };
  });
}

/**
 * Add a tag to a session
 */
export async function addSessionTag(
  sessionId: string,
  tagId: string
): Promise<void> {
  const { error } = await (supabase.from('session_tags') as AnyTable).insert({
    session_id: sessionId,
    tag_id: tagId,
  });

  if (error) {
    if (error.code === '23505') {
      // Tag already exists on session - ignore
      return;
    }
    throw new Error(`Failed to add tag: ${error.message}`);
  }
}

/**
 * Remove a tag from a session
 */
export async function removeSessionTag(
  sessionId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from('session_tags')
    .delete()
    .eq('session_id', sessionId)
    .eq('tag_id', tagId);

  if (error) {
    throw new Error(`Failed to remove tag: ${error.message}`);
  }
}

/**
 * Set all tags for a session (replace existing)
 */
export async function setSessionTags(
  sessionId: string,
  tagIds: string[]
): Promise<void> {
  // Delete existing tags
  await supabase.from('session_tags').delete().eq('session_id', sessionId);

  // Add new tags
  if (tagIds.length > 0) {
    const { error } = await (supabase.from('session_tags') as AnyTable).insert(
      tagIds.map((tagId) => ({
        session_id: sessionId,
        tag_id: tagId,
      }))
    );

    if (error) {
      throw new Error(`Failed to set tags: ${error.message}`);
    }
  }
}
