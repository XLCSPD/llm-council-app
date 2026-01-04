-- Decision Memory: Prompt & Council Recall
-- Migration: 20260103_decision_memory.sql
--
-- Features:
-- 1. Session Annotations (rating, notes)
-- 2. Project-scoped Tags
-- 3. Council Template Enhancements
-- 4. Full-Text Search with PostgreSQL FTS

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- SESSION ANNOTATIONS
-- =============================================================================

-- Stores user ratings and notes for sessions
CREATE TABLE session_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
    rating SMALLINT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient lookups
CREATE INDEX idx_session_annotations_session_id ON session_annotations(session_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_annotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_annotation_updated
    BEFORE UPDATE ON session_annotations
    FOR EACH ROW
    EXECUTE FUNCTION update_session_annotation_timestamp();

-- =============================================================================
-- TAGS SYSTEM
-- =============================================================================

-- Project-scoped tags for categorizing sessions
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#5eead4', -- Default teal to match accent
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, name)
);

-- Session-Tag junction table (many-to-many)
CREATE TABLE session_tags (
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (session_id, tag_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_tags_project_id ON tags(project_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_session_tags_session_id ON session_tags(session_id);
CREATE INDEX idx_session_tags_tag_id ON session_tags(tag_id);

-- =============================================================================
-- COUNCIL TEMPLATE ENHANCEMENTS
-- =============================================================================

-- Add columns for template management
ALTER TABLE councils ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE councils ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE councils ADD COLUMN IF NOT EXISTS usage_count INT DEFAULT 0;
ALTER TABLE councils ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Index for sorting by usage/favorites
CREATE INDEX IF NOT EXISTS idx_councils_favorite ON councils(project_id, is_favorite DESC);
CREATE INDEX IF NOT EXISTS idx_councils_usage ON councils(project_id, usage_count DESC);

-- =============================================================================
-- FULL-TEXT SEARCH
-- =============================================================================

-- Add tsvector columns for FTS
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Function to update session search vector
CREATE OR REPLACE FUNCTION update_session_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update prompt search vector
CREATE OR REPLACE FUNCTION update_prompt_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.content, '') || ' ' ||
        COALESCE(NEW.objective, '') || ' ' ||
        COALESCE(NEW.context, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating search vectors
DROP TRIGGER IF EXISTS session_search_vector_update ON sessions;
CREATE TRIGGER session_search_vector_update
    BEFORE INSERT OR UPDATE OF title ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_search_vector();

DROP TRIGGER IF EXISTS prompt_search_vector_update ON prompts;
CREATE TRIGGER prompt_search_vector_update
    BEFORE INSERT OR UPDATE OF content, objective, context ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_prompt_search_vector();

-- GIN indexes for FTS
CREATE INDEX IF NOT EXISTS idx_sessions_search ON sessions USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_prompts_search ON prompts USING GIN(search_vector);

-- Trigram indexes for fuzzy matching on common fields
CREATE INDEX IF NOT EXISTS idx_sessions_title_trgm ON sessions USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_content_trgm ON prompts USING GIN(content gin_trgm_ops);

-- Backfill existing data with search vectors
UPDATE sessions SET search_vector = to_tsvector('english', COALESCE(title, ''))
WHERE search_vector IS NULL;

UPDATE prompts SET search_vector = to_tsvector('english',
    COALESCE(content, '') || ' ' || COALESCE(objective, '') || ' ' || COALESCE(context, '')
)
WHERE search_vector IS NULL;

-- =============================================================================
-- SEARCH RPC FUNCTION
-- =============================================================================

-- Main search function for Decision Memory
CREATE OR REPLACE FUNCTION search_sessions(
    search_query TEXT DEFAULT '',
    filter_type TEXT DEFAULT 'all',
    tag_ids UUID[] DEFAULT '{}',
    status_filter TEXT[] DEFAULT '{}',
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    rating_min SMALLINT DEFAULT NULL,
    result_limit INT DEFAULT 20,
    result_offset INT DEFAULT 0
)
RETURNS TABLE (
    session_id UUID,
    title TEXT,
    prompt_content TEXT,
    prompt_objective TEXT,
    council_config JSONB,
    run_status TEXT,
    run_phase INT,
    cost_usd NUMERIC,
    created_at TIMESTAMPTZ,
    rating SMALLINT,
    notes TEXT,
    tags JSONB,
    rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH session_data AS (
        SELECT DISTINCT ON (s.id)
            s.id AS session_id,
            s.title,
            p.content AS prompt_content,
            p.objective AS prompt_objective,
            r.council_config,
            r.status AS run_status,
            r.current_phase AS run_phase,
            r.cost_usd,
            s.created_at,
            sa.rating,
            sa.notes,
            COALESCE(
                (SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color))
                 FROM session_tags st
                 JOIN tags t ON t.id = st.tag_id
                 WHERE st.session_id = s.id),
                '[]'::jsonb
            ) AS tags,
            CASE
                WHEN search_query = '' THEN 0::REAL
                ELSE (
                    ts_rank(
                        COALESCE(s.search_vector, ''::tsvector) ||
                        COALESCE(p.search_vector, ''::tsvector),
                        plainto_tsquery('english', search_query)
                    )
                )::REAL
            END AS rank
        FROM sessions s
        LEFT JOIN prompts p ON p.session_id = s.id
        LEFT JOIN runs r ON r.session_id = s.id
        LEFT JOIN session_annotations sa ON sa.session_id = s.id
        JOIN projects proj ON proj.id = s.project_id
        WHERE is_org_member(proj.org_id)
          -- Search filter
          AND (
              search_query = ''
              OR s.search_vector @@ plainto_tsquery('english', search_query)
              OR p.search_vector @@ plainto_tsquery('english', search_query)
              OR s.title ILIKE '%' || search_query || '%'
              OR p.content ILIKE '%' || search_query || '%'
          )
          -- Tag filter
          AND (
              array_length(tag_ids, 1) IS NULL
              OR EXISTS (
                  SELECT 1 FROM session_tags st
                  WHERE st.session_id = s.id AND st.tag_id = ANY(tag_ids)
              )
          )
          -- Status filter
          AND (
              array_length(status_filter, 1) IS NULL
              OR r.status = ANY(status_filter)
          )
          -- Date filters
          AND (date_from IS NULL OR s.created_at >= date_from)
          AND (date_to IS NULL OR s.created_at <= date_to)
          -- Rating filter
          AND (rating_min IS NULL OR sa.rating >= rating_min)
        ORDER BY s.id, r.created_at DESC NULLS LAST
    )
    SELECT *
    FROM session_data
    ORDER BY
        CASE WHEN search_query = '' THEN NULL ELSE rank END DESC NULLS LAST,
        created_at DESC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- Quick search function for command palette (optimized for speed)
CREATE OR REPLACE FUNCTION quick_search_sessions(
    search_query TEXT,
    result_limit INT DEFAULT 10
)
RETURNS TABLE (
    session_id UUID,
    title TEXT,
    prompt_preview TEXT,
    council_members JSONB,
    run_status TEXT,
    created_at TIMESTAMPTZ,
    rating SMALLINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (s.id)
        s.id AS session_id,
        s.title,
        LEFT(p.content, 150) AS prompt_preview,
        r.council_config->'members' AS council_members,
        r.status AS run_status,
        s.created_at,
        sa.rating
    FROM sessions s
    LEFT JOIN prompts p ON p.session_id = s.id
    LEFT JOIN runs r ON r.session_id = s.id
    LEFT JOIN session_annotations sa ON sa.session_id = s.id
    JOIN projects proj ON proj.id = s.project_id
    WHERE is_org_member(proj.org_id)
      AND (
          s.title ILIKE '%' || search_query || '%'
          OR p.content ILIKE '%' || search_query || '%'
      )
    ORDER BY s.id, r.created_at DESC NULLS LAST, s.created_at DESC
    LIMIT result_limit;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE session_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;

-- SESSION ANNOTATIONS: Scoped via session -> project -> org
CREATE POLICY "Users can view session annotations"
    ON session_annotations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = session_annotations.session_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can create session annotations"
    ON session_annotations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = session_annotations.session_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can update session annotations"
    ON session_annotations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = session_annotations.session_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can delete session annotations"
    ON session_annotations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = session_annotations.session_id
            AND is_org_member(p.org_id)
        )
    );

-- TAGS: Scoped via project -> org
CREATE POLICY "Users can view tags"
    ON tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = tags.project_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can create tags"
    ON tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = tags.project_id
            AND is_org_member(p.org_id)
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update tags"
    ON tags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = tags.project_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can delete tags"
    ON tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = tags.project_id
            AND is_org_member(p.org_id)
        )
        AND created_by = auth.uid()
    );

-- SESSION_TAGS: Scoped via session -> project -> org
CREATE POLICY "Users can view session tags"
    ON session_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = session_tags.session_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can create session tags"
    ON session_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = session_tags.session_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can delete session tags"
    ON session_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = session_tags.session_id
            AND is_org_member(p.org_id)
        )
    );

-- =============================================================================
-- REALTIME (for live annotation updates)
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE session_annotations;
