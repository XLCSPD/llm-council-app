-- =============================================================================
-- Smart History: Pinned Sessions & Auto-Archive
-- =============================================================================
-- Adds pinning and archiving capabilities to sessions for better organization

-- -----------------------------------------------------------------------------
-- 1. Add Pinned Columns to Sessions
-- -----------------------------------------------------------------------------

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS pin_order INTEGER;

-- Index for efficient pinned queries
CREATE INDEX IF NOT EXISTS idx_sessions_pinned
ON sessions (project_id, is_pinned, pinned_at DESC)
WHERE is_pinned = TRUE;

-- -----------------------------------------------------------------------------
-- 2. Add Archive Columns to Sessions
-- -----------------------------------------------------------------------------

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- Index for efficient archive queries
CREATE INDEX IF NOT EXISTS idx_sessions_archived
ON sessions (project_id, is_archived, archived_at DESC)
WHERE is_archived = TRUE;

-- Index for active (non-archived) sessions
CREATE INDEX IF NOT EXISTS idx_sessions_active
ON sessions (project_id, created_at DESC)
WHERE is_archived = FALSE OR is_archived IS NULL;

-- -----------------------------------------------------------------------------
-- 3. Pin/Unpin Functions
-- -----------------------------------------------------------------------------

-- Function to pin a session
CREATE OR REPLACE FUNCTION pin_session(p_session_id UUID)
RETURNS void AS $$
DECLARE
    v_project_id UUID;
    v_max_order INTEGER;
    v_pinned_count INTEGER;
BEGIN
    -- Get project_id for the session
    SELECT project_id INTO v_project_id FROM sessions WHERE id = p_session_id;

    -- Check pinned count (max 5)
    SELECT COUNT(*) INTO v_pinned_count
    FROM sessions
    WHERE project_id = v_project_id AND is_pinned = TRUE;

    IF v_pinned_count >= 5 THEN
        RAISE EXCEPTION 'Maximum of 5 pinned sessions allowed';
    END IF;

    -- Get max pin_order for the project
    SELECT COALESCE(MAX(pin_order), 0) INTO v_max_order
    FROM sessions
    WHERE project_id = v_project_id AND is_pinned = TRUE;

    -- Pin the session
    UPDATE sessions
    SET is_pinned = TRUE,
        pinned_at = NOW(),
        pin_order = v_max_order + 1
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unpin a session
CREATE OR REPLACE FUNCTION unpin_session(p_session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE sessions
    SET is_pinned = FALSE,
        pinned_at = NULL,
        pin_order = NULL
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder pinned sessions
CREATE OR REPLACE FUNCTION reorder_pinned_sessions(p_session_ids UUID[])
RETURNS void AS $$
DECLARE
    v_session_id UUID;
    v_order INTEGER := 1;
BEGIN
    FOREACH v_session_id IN ARRAY p_session_ids
    LOOP
        UPDATE sessions
        SET pin_order = v_order
        WHERE id = v_session_id AND is_pinned = TRUE;
        v_order := v_order + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 4. Archive Functions
-- -----------------------------------------------------------------------------

-- Function to archive a session
CREATE OR REPLACE FUNCTION archive_session(p_session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE sessions
    SET is_archived = TRUE,
        archived_at = NOW(),
        is_pinned = FALSE,  -- Unpin when archiving
        pinned_at = NULL,
        pin_order = NULL
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a session from archive
CREATE OR REPLACE FUNCTION restore_session(p_session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE sessions
    SET is_archived = FALSE,
        archived_at = NULL,
        last_accessed_at = NOW()
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-archive old sessions (called by cron or manually)
CREATE OR REPLACE FUNCTION auto_archive_sessions(p_project_id UUID, p_days_inactive INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    v_archived_count INTEGER;
BEGIN
    WITH archived AS (
        UPDATE sessions
        SET is_archived = TRUE,
            archived_at = NOW()
        WHERE project_id = p_project_id
          AND is_archived = FALSE
          AND is_pinned = FALSE
          AND last_accessed_at < NOW() - (p_days_inactive || ' days')::INTERVAL
          -- Don't archive sessions with ratings (user marked as important)
          AND id NOT IN (
              SELECT session_id FROM session_annotations WHERE rating IS NOT NULL
          )
        RETURNING id
    )
    SELECT COUNT(*) INTO v_archived_count FROM archived;

    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 5. Update Last Accessed Timestamp
-- -----------------------------------------------------------------------------

-- Function to update last_accessed_at when viewing a session
CREATE OR REPLACE FUNCTION touch_session(p_session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE sessions
    SET last_accessed_at = NOW()
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 6. Get Sessions with Smart Grouping
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_smart_history(
    p_project_id UUID,
    p_include_archived BOOLEAN DEFAULT FALSE,
    p_filters JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    current_phase TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_pinned BOOLEAN,
    pin_order INTEGER,
    is_archived BOOLEAN,
    last_accessed_at TIMESTAMPTZ,
    rating SMALLINT,
    has_tags BOOLEAN,
    council_name TEXT,
    time_group TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.title,
        COALESCE(latest_run.status, 'draft')::TEXT AS status,
        COALESCE(latest_run.current_phase::TEXT, 'setup') AS current_phase,
        s.created_at,
        COALESCE(latest_run.ended_at, s.created_at) AS updated_at,
        COALESCE(s.is_pinned, FALSE),
        s.pin_order,
        COALESCE(s.is_archived, FALSE),
        COALESCE(s.last_accessed_at, s.created_at),
        sa.rating,
        EXISTS(SELECT 1 FROM session_tags st WHERE st.session_id = s.id) AS has_tags,
        NULL::TEXT AS council_name,
        CASE
            WHEN COALESCE(s.is_pinned, FALSE) = TRUE THEN 'pinned'
            WHEN s.created_at >= DATE_TRUNC('day', NOW()) THEN 'today'
            WHEN s.created_at >= DATE_TRUNC('day', NOW() - INTERVAL '1 day') THEN 'yesterday'
            WHEN s.created_at >= DATE_TRUNC('week', NOW()) THEN 'this_week'
            ELSE TO_CHAR(s.created_at, 'Mon_YYYY')
        END AS time_group
    FROM sessions s
    LEFT JOIN session_annotations sa ON sa.session_id = s.id
    LEFT JOIN LATERAL (
        SELECT r.status, r.current_phase, r.ended_at
        FROM runs r
        WHERE r.session_id = s.id
        ORDER BY r.created_at DESC
        LIMIT 1
    ) latest_run ON TRUE
    WHERE s.project_id = p_project_id
      AND (
          p_include_archived = TRUE
          OR COALESCE(s.is_archived, FALSE) = FALSE
      )
      -- Apply filters from JSONB
      AND (
          (p_filters->>'rated' IS NULL OR p_filters->>'rated' = 'false')
          OR sa.rating IS NOT NULL
      )
      AND (
          (p_filters->>'tagged' IS NULL OR p_filters->>'tagged' = 'false')
          OR EXISTS(SELECT 1 FROM session_tags st WHERE st.session_id = s.id)
      )
      AND (
          (p_filters->>'completed' IS NULL OR p_filters->>'completed' = 'false')
          OR latest_run.status = 'succeeded'
      )
      AND (
          (p_filters->>'running' IS NULL OR p_filters->>'running' = 'false')
          OR latest_run.status = 'running'
      )
    ORDER BY
        COALESCE(s.is_pinned, FALSE) DESC,
        s.pin_order ASC NULLS LAST,
        s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 7. Grant Permissions
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION pin_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unpin_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_pinned_sessions(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION touch_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_history(UUID, BOOLEAN, JSONB) TO authenticated;

-- Note: auto_archive_sessions should be called by service role only (cron job)
