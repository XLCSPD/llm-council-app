-- Admin Panel Support
-- Migration: 20260125_admin_panel.sql
-- Adds audit logging, user activity tracking, and admin management capabilities

-- =============================================================================
-- TABLE: admin_audit_logs
-- Comprehensive audit trail for all admin actions
-- =============================================================================

CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN (
        'member_role_change',
        'member_removed',
        'invite_created',
        'invite_canceled',
        'invite_resent',
        'invite_deleted'
    )),
    target_type TEXT NOT NULL CHECK (target_type IN ('member', 'invite')),
    target_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_admin_audit_logs_org_id ON admin_audit_logs(org_id);
CREATE INDEX idx_admin_audit_logs_actor_id ON admin_audit_logs(actor_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);

-- =============================================================================
-- TABLE: user_activity
-- Track user engagement metrics
-- =============================================================================

CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    last_login_at TIMESTAMPTZ,
    login_count INT DEFAULT 0,
    last_session_at TIMESTAMPTZ,
    session_count INT DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    run_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for user lookups
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_last_login ON user_activity(last_login_at DESC);

-- =============================================================================
-- SCHEMA MODIFICATIONS
-- =============================================================================

-- Add updated_at to org_members for tracking role changes
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Admin audit logs: Only org admins can view
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view audit logs"
    ON admin_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM org_members
            WHERE org_members.org_id = admin_audit_logs.org_id
            AND org_members.user_id = auth.uid()
            AND org_members.role IN ('owner', 'admin')
        )
    );

-- Service role bypass for inserting audit logs (orchestrator uses service role)
-- Note: Service role already bypasses RLS, so no INSERT policy needed

-- User activity: Users see own data, admins see org members' data
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
    ON user_activity FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Org admins can view member activity"
    ON user_activity FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM org_members om1
            JOIN org_members om2 ON om1.org_id = om2.org_id
            WHERE om1.user_id = auth.uid()
            AND om1.role IN ('owner', 'admin')
            AND om2.user_id = user_activity.user_id
        )
    );

-- Add policy for org_members updates (only owners can change roles)
CREATE POLICY "Org owners can update member roles"
    ON org_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM org_members existing
            WHERE existing.org_id = org_members.org_id
            AND existing.user_id = auth.uid()
            AND existing.role = 'owner'
        )
    );

-- Add policy for org_invites deletion (admins can delete)
CREATE POLICY "Org admins can delete invites"
    ON org_invites FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM org_members
            WHERE org_members.org_id = org_invites.org_id
            AND org_members.user_id = auth.uid()
            AND org_members.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get member activity stats for a specific user in an org
CREATE OR REPLACE FUNCTION get_member_activity_stats(p_org_id UUID, p_user_id UUID)
RETURNS TABLE (
    session_count BIGINT,
    run_count BIGINT,
    last_active_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH user_sessions AS (
        SELECT COUNT(*) as cnt, MAX(s.created_at) as last_at
        FROM sessions s
        JOIN projects p ON s.project_id = p.id
        WHERE p.org_id = p_org_id AND s.created_by = p_user_id
    ),
    user_runs AS (
        SELECT COUNT(*) as cnt, MAX(r.created_at) as last_at
        FROM runs r
        JOIN sessions s ON r.session_id = s.id
        JOIN projects p ON s.project_id = p.id
        WHERE p.org_id = p_org_id AND s.created_by = p_user_id
    )
    SELECT
        COALESCE((SELECT cnt FROM user_sessions), 0) as session_count,
        COALESCE((SELECT cnt FROM user_runs), 0) as run_count,
        GREATEST(
            (SELECT last_at FROM user_sessions),
            (SELECT last_at FROM user_runs)
        ) as last_active_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_member_activity_stats(UUID, UUID) TO authenticated;

-- Function to update user activity on login (can be called from auth hooks)
CREATE OR REPLACE FUNCTION update_user_login_activity(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity (user_id, last_login_at, login_count)
    VALUES (p_user_id, NOW(), 1)
    ON CONFLICT (user_id) DO UPDATE
    SET last_login_at = NOW(),
        login_count = user_activity.login_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_login_activity(UUID) TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all admin actions including role changes, member removals, and invite management';
COMMENT ON TABLE user_activity IS 'Tracks user engagement metrics including login frequency and session/run counts';
COMMENT ON FUNCTION get_member_activity_stats(UUID, UUID) IS 'Returns session and run counts for a user within an organization';
COMMENT ON FUNCTION update_user_login_activity(UUID) IS 'Updates user activity metrics on login';
