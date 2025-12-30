-- LLM Council Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Organizations/Teams
CREATE TABLE orgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Organization Members
CREATE TABLE org_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(org_id, user_id)
);

-- Projects (containers for sessions)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Council Templates (saved configurations)
CREATE TABLE councils (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- config schema: { members: [{model_id, role, weight, token_limit}], chairman_model_id }
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sessions (decision threads)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Prompts (user submissions within a session)
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    objective TEXT,
    constraints JSONB DEFAULT '[]'::jsonb,
    audience TEXT,
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Runs (council execution instances)
CREATE TABLE runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    council_config JSONB NOT NULL,
    -- Snapshot of council at run time
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'canceled')),
    current_phase INT NOT NULL DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 4),
    phase_status JSONB DEFAULT '{}'::jsonb,
    -- { "phase_2": { "started_at": "...", "completed_at": "..." }, ... }
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    error JSONB,
    cost_usd NUMERIC(10, 6),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Run Models (participating models for a run)
CREATE TABLE run_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    model_key TEXT NOT NULL,
    -- e.g., "openai/gpt-4o"
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('thinker', 'critic', 'devils_advocate', 'chair')),
    weight NUMERIC(3, 2) DEFAULT 1.0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
    latency_ms INT,
    cost_usd NUMERIC(10, 6),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Model Outputs (output from each model per phase)
CREATE TABLE model_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_model_id UUID NOT NULL REFERENCES run_models(id) ON DELETE CASCADE,
    phase INT NOT NULL CHECK (phase BETWEEN 2 AND 4),
    -- 2=answer, 3=critique, 4=synthesis
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- { tokens_used, prompt_tokens, completion_tokens, etc }
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Peer Reviews (model-to-model rankings)
CREATE TABLE peer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    reviewer_run_model_id UUID NOT NULL REFERENCES run_models(id) ON DELETE CASCADE,
    reviewed_run_model_id UUID NOT NULL REFERENCES run_models(id) ON DELETE CASCADE,
    score NUMERIC(3, 1) NOT NULL CHECK (score BETWEEN 0 AND 10),
    rationale TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Artifacts (optional: exports, logs)
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('md', 'pdf', 'json')),
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_councils_project_id ON councils(project_id);
CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_prompts_session_id ON prompts(session_id);
CREATE INDEX idx_runs_session_id ON runs(session_id);
CREATE INDEX idx_runs_prompt_id ON runs(prompt_id);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_run_models_run_id ON run_models(run_id);
CREATE INDEX idx_model_outputs_run_model_id ON model_outputs(run_model_id);
CREATE INDEX idx_peer_reviews_run_id ON peer_reviews(run_id);
CREATE INDEX idx_artifacts_run_id ON artifacts(run_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership
CREATE OR REPLACE FUNCTION is_org_member(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM org_members
        WHERE org_id = check_org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's orgs
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT org_id FROM org_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- ORGS: Users can see orgs they belong to
CREATE POLICY "Users can view their orgs"
    ON orgs FOR SELECT
    USING (id IN (SELECT user_org_ids()));

CREATE POLICY "Users can create orgs"
    ON orgs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Org owners can update"
    ON orgs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM org_members
            WHERE org_id = orgs.id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- ORG_MEMBERS: Users can see members of their orgs
CREATE POLICY "Users can view org members"
    ON org_members FOR SELECT
    USING (is_org_member(org_id));

CREATE POLICY "Org admins can manage members"
    ON org_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM org_members existing
            WHERE existing.org_id = org_members.org_id
            AND existing.user_id = auth.uid()
            AND existing.role IN ('owner', 'admin')
        )
        OR NOT EXISTS (
            SELECT 1 FROM org_members WHERE org_id = org_members.org_id
        )
    );

CREATE POLICY "Org admins can remove members"
    ON org_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM org_members existing
            WHERE existing.org_id = org_members.org_id
            AND existing.user_id = auth.uid()
            AND existing.role IN ('owner', 'admin')
        )
    );

-- PROJECTS: Users can access projects in their orgs
CREATE POLICY "Users can view projects"
    ON projects FOR SELECT
    USING (is_org_member(org_id));

CREATE POLICY "Users can create projects"
    ON projects FOR INSERT
    WITH CHECK (is_org_member(org_id) AND created_by = auth.uid());

CREATE POLICY "Users can update their projects"
    ON projects FOR UPDATE
    USING (is_org_member(org_id));

CREATE POLICY "Users can delete their projects"
    ON projects FOR DELETE
    USING (is_org_member(org_id) AND created_by = auth.uid());

-- COUNCILS: Same as projects (scoped to project's org)
CREATE POLICY "Users can view councils"
    ON councils FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = councils.project_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can create councils"
    ON councils FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = councils.project_id
            AND is_org_member(p.org_id)
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update councils"
    ON councils FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = councils.project_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can delete councils"
    ON councils FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = councils.project_id
            AND is_org_member(p.org_id)
        )
        AND created_by = auth.uid()
    );

-- SESSIONS: Scoped to project's org
CREATE POLICY "Users can view sessions"
    ON sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = sessions.project_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can create sessions"
    ON sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = sessions.project_id
            AND is_org_member(p.org_id)
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update sessions"
    ON sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = sessions.project_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can delete sessions"
    ON sessions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = sessions.project_id
            AND is_org_member(p.org_id)
        )
        AND created_by = auth.uid()
    );

-- PROMPTS: Scoped via session -> project -> org
CREATE POLICY "Users can view prompts"
    ON prompts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = prompts.session_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can create prompts"
    ON prompts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = prompts.session_id
            AND is_org_member(p.org_id)
        )
        AND user_id = auth.uid()
    );

-- RUNS: Scoped via session -> project -> org
CREATE POLICY "Users can view runs"
    ON runs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = runs.session_id
            AND is_org_member(p.org_id)
        )
    );

CREATE POLICY "Users can create runs"
    ON runs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN projects p ON p.id = s.project_id
            WHERE s.id = runs.session_id
            AND is_org_member(p.org_id)
        )
    );

-- RUN_MODELS: Scoped via run -> session -> project -> org
CREATE POLICY "Users can view run_models"
    ON run_models FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM runs r
            JOIN sessions s ON s.id = r.session_id
            JOIN projects p ON p.id = s.project_id
            WHERE r.id = run_models.run_id
            AND is_org_member(p.org_id)
        )
    );

-- MODEL_OUTPUTS: Scoped via run_model -> run -> session -> project -> org
CREATE POLICY "Users can view model_outputs"
    ON model_outputs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM run_models rm
            JOIN runs r ON r.id = rm.run_id
            JOIN sessions s ON s.id = r.session_id
            JOIN projects p ON p.id = s.project_id
            WHERE rm.id = model_outputs.run_model_id
            AND is_org_member(p.org_id)
        )
    );

-- PEER_REVIEWS: Scoped via run
CREATE POLICY "Users can view peer_reviews"
    ON peer_reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM runs r
            JOIN sessions s ON s.id = r.session_id
            JOIN projects p ON p.id = s.project_id
            WHERE r.id = peer_reviews.run_id
            AND is_org_member(p.org_id)
        )
    );

-- ARTIFACTS: Scoped via run
CREATE POLICY "Users can view artifacts"
    ON artifacts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM runs r
            JOIN sessions s ON s.id = r.session_id
            JOIN projects p ON p.id = s.project_id
            WHERE r.id = artifacts.run_id
            AND is_org_member(p.org_id)
        )
    );

-- =============================================================================
-- SERVICE ROLE BYPASS (for orchestrator)
-- Note: The service role key bypasses RLS by default in Supabase
-- =============================================================================

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-create org membership when org is created
CREATE OR REPLACE FUNCTION auto_add_org_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_org_created
    AFTER INSERT ON orgs
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_org_owner();

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE runs;
ALTER PUBLICATION supabase_realtime ADD TABLE run_models;
ALTER PUBLICATION supabase_realtime ADD TABLE model_outputs;
ALTER PUBLICATION supabase_realtime ADD TABLE peer_reviews;
