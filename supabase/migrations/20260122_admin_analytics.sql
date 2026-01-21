-- Migration: Admin Analytics Support
-- Creates platform_admins table for super admin access and performance indexes

-- =============================================================================
-- Platform Admins Table
-- =============================================================================

-- Table to designate platform-wide administrators (super admins)
CREATE TABLE IF NOT EXISTS platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view the admin list
CREATE POLICY "Platform admins can view admin list"
    ON platform_admins FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM platform_admins));

-- Helper function to check if current user is a platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_admins
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;

-- =============================================================================
-- Performance Indexes for Analytics Queries
-- =============================================================================

-- Index for run time-series queries
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at);

-- Index for run_models time-series queries
CREATE INDEX IF NOT EXISTS idx_run_models_created_at ON run_models(created_at);

-- Composite index for user activity queries (sessions by user over time)
CREATE INDEX IF NOT EXISTS idx_sessions_created_by_created_at
    ON sessions(created_by, created_at);

-- Index for project lookups by org (for org-scoped analytics)
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);

-- Index for runs by status (for success rate calculations)
CREATE INDEX IF NOT EXISTS idx_runs_status_created ON runs(status, created_at);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE platform_admins IS 'Users with platform-wide admin access for analytics and management';
COMMENT ON FUNCTION is_platform_admin() IS 'Check if current authenticated user is a platform administrator';
