-- Add name column to org_invites for personalized invitation emails
-- Migration: 20260119_org_invites_add_name.sql

ALTER TABLE org_invites
ADD COLUMN IF NOT EXISTS name TEXT;

COMMENT ON COLUMN org_invites.name IS 'Optional name of the invitee for personalized invitation emails';
