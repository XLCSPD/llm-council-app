-- Organization Invites
-- Migration: 20260118_org_invites.sql
-- Adds invite system for team member management

-- =============================================================================
-- TABLE: org_invites
-- =============================================================================

CREATE TABLE org_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Prevent duplicate pending invites for same email in same org
    UNIQUE(org_id, email, status)
);

-- Indexes for common queries
CREATE INDEX idx_org_invites_org_id ON org_invites(org_id);
CREATE INDEX idx_org_invites_email ON org_invites(email);
CREATE INDEX idx_org_invites_status ON org_invites(status);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- Org admins/owners can view invites for their org
CREATE POLICY "Org admins can view invites"
    ON org_invites FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM org_members
            WHERE org_members.org_id = org_invites.org_id
            AND org_members.user_id = auth.uid()
            AND org_members.role IN ('owner', 'admin')
        )
    );

-- Org admins/owners can create invites
CREATE POLICY "Org admins can create invites"
    ON org_invites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM org_members
            WHERE org_members.org_id = org_invites.org_id
            AND org_members.user_id = auth.uid()
            AND org_members.role IN ('owner', 'admin')
        )
        AND invited_by = auth.uid()
    );

-- Org admins/owners can update invites (cancel/expire)
CREATE POLICY "Org admins can update invites"
    ON org_invites FOR UPDATE
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

-- Function to accept an invite and add user to org
-- Called after user authenticates via invite link
CREATE OR REPLACE FUNCTION accept_org_invite(p_invite_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_invite RECORD;
    v_result JSONB;
BEGIN
    -- Get the invite
    SELECT * INTO v_invite FROM org_invites
    WHERE id = p_invite_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invite not found or already used');
    END IF;

    -- Check if expired
    IF v_invite.expires_at < NOW() THEN
        UPDATE org_invites SET status = 'expired' WHERE id = p_invite_id;
        RETURN jsonb_build_object('success', false, 'error', 'Invite has expired');
    END IF;

    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM org_members
        WHERE org_id = v_invite.org_id AND user_id = p_user_id
    ) THEN
        -- Mark invite as accepted anyway
        UPDATE org_invites
        SET status = 'accepted', accepted_at = NOW()
        WHERE id = p_invite_id;
        RETURN jsonb_build_object('success', true, 'message', 'Already a member of this organization');
    END IF;

    -- Add user to org with the specified role
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (v_invite.org_id, p_user_id, v_invite.role);

    -- Mark invite as accepted
    UPDATE org_invites
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = p_invite_id;

    RETURN jsonb_build_object(
        'success', true,
        'org_id', v_invite.org_id,
        'role', v_invite.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_org_invite(UUID, UUID) TO authenticated;

-- Function to check if an email has a pending invite for an org
CREATE OR REPLACE FUNCTION has_pending_invite(p_org_id UUID, p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM org_invites
        WHERE org_id = p_org_id
        AND LOWER(email) = LOWER(p_email)
        AND status = 'pending'
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION has_pending_invite(UUID, TEXT) TO authenticated;
