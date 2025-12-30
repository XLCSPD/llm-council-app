-- Create a function to setup user workspace (org + project)
-- This uses SECURITY DEFINER to bypass RLS and allow first-time setup

CREATE OR REPLACE FUNCTION setup_user_workspace(user_uuid UUID)
RETURNS TABLE (out_org_id UUID, out_project_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_project_id UUID;
BEGIN
    -- Check if user already has an org
    SELECT om.org_id INTO v_org_id
    FROM org_members om
    WHERE om.user_id = user_uuid
    LIMIT 1;

    IF v_org_id IS NOT NULL THEN
        -- User has an org, find their project
        SELECT p.id INTO v_project_id
        FROM projects p
        WHERE p.org_id = v_org_id
        LIMIT 1;

        IF v_project_id IS NULL THEN
            -- Create default project
            INSERT INTO projects (org_id, name, created_by)
            VALUES (v_org_id, 'Default Project', user_uuid)
            RETURNING id INTO v_project_id;
        END IF;
    ELSE
        -- Create new org
        INSERT INTO orgs (name)
        VALUES ('My Organization')
        RETURNING id INTO v_org_id;

        -- Add user as org member (use ON CONFLICT to handle race conditions)
        INSERT INTO org_members (org_id, user_id, role)
        VALUES (v_org_id, user_uuid, 'owner')
        ON CONFLICT (org_id, user_id) DO NOTHING;

        -- Create default project
        INSERT INTO projects (org_id, name, created_by)
        VALUES (v_org_id, 'Default Project', user_uuid)
        RETURNING id INTO v_project_id;
    END IF;

    -- Return the result
    out_org_id := v_org_id;
    out_project_id := v_project_id;
    RETURN NEXT;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION setup_user_workspace TO authenticated;

-- Also update RLS policies to allow users to read their own data
-- (These may already exist, but ensuring they're correct)

-- Policy for org_members: users can see their own memberships
DROP POLICY IF EXISTS "Users can view their org memberships" ON org_members;
CREATE POLICY "Users can view their org memberships" ON org_members
    FOR SELECT USING (user_id = auth.uid());

-- Policy for orgs: users can view orgs they're members of
DROP POLICY IF EXISTS "Users can view their orgs" ON orgs;
CREATE POLICY "Users can view their orgs" ON orgs
    FOR SELECT USING (
        id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    );

-- Policy for projects: users can view projects in their orgs
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
CREATE POLICY "Users can view their projects" ON projects
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    );

-- Policy for sessions: users can create and view sessions in their projects
DROP POLICY IF EXISTS "Users can manage sessions in their projects" ON sessions;
CREATE POLICY "Users can manage sessions in their projects" ON sessions
    FOR ALL USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN org_members om ON om.org_id = p.org_id
            WHERE om.user_id = auth.uid()
        )
    );
