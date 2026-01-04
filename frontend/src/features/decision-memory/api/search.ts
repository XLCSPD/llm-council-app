/**
 * Decision Memory Search API
 * Full-text search using Supabase PostgreSQL FTS
 *
 * Note: Type assertions are used because the RPC functions are newly added
 * and types haven't been regenerated yet
 */

import { supabase } from '@/lib/supabase';
import type { SearchResult, QuickSearchResult, SearchFilters } from '../types';

interface SearchSessionsParams {
  query?: string;
  filters?: Partial<SearchFilters>;
  limit?: number;
  offset?: number;
}

/**
 * Full search with filters - uses the search_sessions RPC function
 */
export async function searchSessions({
  query = '',
  filters = {},
  limit = 20,
  offset = 0,
}: SearchSessionsParams): Promise<SearchResult[]> {
  // Type assertion needed because RPC function types aren't generated yet
  const { data, error } = await (supabase.rpc as CallableFunction)('search_sessions', {
    search_query: query,
    filter_type: filters.type || 'all',
    tag_ids: filters.tagIds || [],
    status_filter: filters.status || [],
    date_from: filters.dateFrom?.toISOString() || null,
    date_to: filters.dateTo?.toISOString() || null,
    rating_min: filters.ratingMin || null,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }

  // Transform the response to match our types
  return (data || []).map((row: Record<string, unknown>) => ({
    session_id: row.session_id as string,
    title: row.title as string | null,
    prompt_content: row.prompt_content as string | null,
    prompt_objective: row.prompt_objective as string | null,
    council_config: row.council_config as SearchResult['council_config'],
    run_status: row.run_status as string | null,
    run_phase: row.run_phase as number | null,
    cost_usd: row.cost_usd as number | null,
    created_at: row.created_at as string,
    rating: row.rating as number | null,
    notes: row.notes as string | null,
    tags: (row.tags as SearchResult['tags']) || [],
    rank: row.rank as number,
  }));
}

/**
 * Quick search for command palette - optimized for speed
 */
export async function quickSearch(
  query: string,
  limit = 10
): Promise<QuickSearchResult[]> {
  if (!query.trim()) {
    // Return recent sessions when no query
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        created_at,
        prompts!inner(content),
        runs(
          status,
          council_config
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Recent sessions error:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any[]) || []).map((session) => {
      const prompt = Array.isArray(session.prompts)
        ? session.prompts[0]
        : session.prompts;
      const run = Array.isArray(session.runs)
        ? session.runs[0]
        : session.runs;

      return {
        session_id: session.id,
        title: session.title,
        prompt_preview: prompt?.content?.substring(0, 150) || null,
        council_members: run?.council_config?.members || null,
        run_status: run?.status || null,
        created_at: session.created_at,
        rating: null, // Would need join with annotations
      };
    });
  }

  // Use the quick_search_sessions RPC function
  // Type assertion needed because RPC function types aren't generated yet
  const { data, error } = await (supabase.rpc as CallableFunction)('quick_search_sessions', {
    search_query: query,
    result_limit: limit,
  });

  if (error) {
    console.error('Quick search error:', error);
    throw new Error(`Quick search failed: ${error.message}`);
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    session_id: row.session_id as string,
    title: row.title as string | null,
    prompt_preview: row.prompt_preview as string | null,
    council_members: row.council_members as QuickSearchResult['council_members'],
    run_status: row.run_status as string | null,
    created_at: row.created_at as string,
    rating: row.rating as number | null,
  }));
}

/**
 * Get sessions by tag
 */
export async function getSessionsByTag(tagId: string): Promise<SearchResult[]> {
  return searchSessions({
    filters: { tagIds: [tagId] },
    limit: 50,
  });
}

/**
 * Get recent sessions with high ratings
 */
export async function getTopRatedSessions(limit = 10): Promise<SearchResult[]> {
  return searchSessions({
    filters: { ratingMin: 4 },
    limit,
  });
}
