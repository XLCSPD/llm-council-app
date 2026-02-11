-- Fix setup_user_workspace to use deterministic ordering when selecting projects.
-- Previously used LIMIT 1 without ORDER BY, which could return different projects
-- across calls for users with multiple projects.

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
    -- Check if user already has an org (oldest membership for stability)
    SELECT om.org_id INTO v_org_id
    FROM org_members om
    WHERE om.user_id = user_uuid
    ORDER BY om.created_at ASC
    LIMIT 1;

    IF v_org_id IS NOT NULL THEN
        -- User has an org, find their oldest project (deterministic)
        SELECT p.id INTO v_project_id
        FROM projects p
        WHERE p.org_id = v_org_id
        ORDER BY p.created_at ASC
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
