-- Performance optimization indexes
-- Migration: 20260104_performance_indexes.sql

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =============================================================================

-- Session queries: filter by project + order by created_at
-- Covers: "SELECT * FROM sessions WHERE project_id = ? ORDER BY created_at DESC"
CREATE INDEX IF NOT EXISTS idx_sessions_project_created
    ON sessions(project_id, created_at DESC);

-- Session queries by user: filter by created_by + order by created_at
-- Covers: "SELECT * FROM sessions WHERE created_by = ? ORDER BY created_at DESC"
CREATE INDEX IF NOT EXISTS idx_sessions_user_created
    ON sessions(created_by, created_at DESC);

-- Run queries: filter by session + order by created_at
-- Covers: "SELECT * FROM runs WHERE session_id = ? ORDER BY created_at DESC"
CREATE INDEX IF NOT EXISTS idx_runs_session_created
    ON runs(session_id, created_at DESC);

-- Model outputs: filter by run_model_id + phase (common for phase-specific queries)
-- Covers: "SELECT * FROM model_outputs WHERE run_model_id = ? AND phase = ?"
CREATE INDEX IF NOT EXISTS idx_model_outputs_run_model_phase
    ON model_outputs(run_model_id, phase);

-- =============================================================================
-- COVERING INDEXES FOR FREQUENTLY ACCESSED COLUMNS
-- =============================================================================

-- Sessions list view - include commonly selected columns to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_sessions_list_covering
    ON sessions(project_id, created_at DESC)
    INCLUDE (title, created_by);

-- Runs status checking - include status to speed up polling queries
CREATE INDEX IF NOT EXISTS idx_runs_session_status
    ON runs(session_id)
    INCLUDE (status, current_phase, created_at);

-- =============================================================================
-- SMART HISTORY INDEXES (for Decision Memory feature)
-- =============================================================================

-- Session access pattern for smart history temporal grouping
-- Index on last_accessed_at for "recently used" queries
CREATE INDEX IF NOT EXISTS idx_sessions_last_accessed
    ON sessions(project_id, last_accessed_at DESC NULLS LAST)
    WHERE last_accessed_at IS NOT NULL;

-- Pinned sessions query
CREATE INDEX IF NOT EXISTS idx_sessions_pinned
    ON sessions(project_id, pin_order ASC NULLS LAST)
    WHERE is_pinned = true;

-- Archived sessions (separate from main queries)
CREATE INDEX IF NOT EXISTS idx_sessions_archived
    ON sessions(project_id, created_at DESC)
    WHERE is_archived = true;

-- Active sessions (non-archived) - most common query path
CREATE INDEX IF NOT EXISTS idx_sessions_active
    ON sessions(project_id, created_at DESC)
    WHERE is_archived = false OR is_archived IS NULL;

-- =============================================================================
-- REALTIME OPTIMIZATION
-- =============================================================================

-- Run models status - helps filter realtime events
CREATE INDEX IF NOT EXISTS idx_run_models_status
    ON run_models(run_id, status);

-- =============================================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- =============================================================================

-- Create an optimized function for getting session list with latest run status
-- This avoids N+1 queries when loading the sidebar
CREATE OR REPLACE FUNCTION get_sessions_with_status(
    p_project_id UUID,
    p_limit INT DEFAULT 50,
    p_include_archived BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    created_at TIMESTAMPTZ,
    created_by UUID,
    is_pinned BOOLEAN,
    is_archived BOOLEAN,
    last_accessed_at TIMESTAMPTZ,
    latest_run_status TEXT,
    latest_run_phase INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.title,
        s.created_at,
        s.created_by,
        COALESCE(s.is_pinned, false) as is_pinned,
        COALESCE(s.is_archived, false) as is_archived,
        s.last_accessed_at,
        r.status as latest_run_status,
        r.current_phase as latest_run_phase
    FROM sessions s
    LEFT JOIN LATERAL (
        SELECT runs.status, runs.current_phase
        FROM runs
        WHERE runs.session_id = s.id
        ORDER BY runs.created_at DESC
        LIMIT 1
    ) r ON true
    WHERE s.project_id = p_project_id
        AND (p_include_archived OR COALESCE(s.is_archived, false) = false)
    ORDER BY
        COALESCE(s.is_pinned, false) DESC,
        s.pin_order ASC NULLS LAST,
        COALESCE(s.last_accessed_at, s.created_at) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_sessions_with_status TO authenticated;

-- =============================================================================
-- SEARCH OPTIMIZATION
-- =============================================================================

-- Add pg_trgm extension for fuzzy text search (if not exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for session title fuzzy search
CREATE INDEX IF NOT EXISTS idx_sessions_title_trgm
    ON sessions USING gin(title gin_trgm_ops);

-- Create search function for sessions
CREATE OR REPLACE FUNCTION search_sessions(
    p_project_id UUID,
    p_query TEXT,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    created_at TIMESTAMPTZ,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.title,
        s.created_at,
        similarity(s.title, p_query) as similarity_score
    FROM sessions s
    WHERE s.project_id = p_project_id
        AND (
            s.title ILIKE '%' || p_query || '%'
            OR similarity(s.title, p_query) > 0.1
        )
        AND COALESCE(s.is_archived, false) = false
    ORDER BY similarity(s.title, p_query) DESC, s.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_sessions TO authenticated;

-- =============================================================================
-- ANALYZE TABLES
-- =============================================================================

-- Update statistics for query planner
ANALYZE sessions;
ANALYZE runs;
ANALYZE run_models;
ANALYZE model_outputs;
ANALYZE peer_reviews;
