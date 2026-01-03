-- Migration: Add prompt attachments support
-- Adds attachments column to prompts table and creates storage bucket

-- Add attachments column to prompts table (stores as JSONB array)
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create index for efficient querying of attachments
CREATE INDEX IF NOT EXISTS idx_prompts_has_attachments
ON prompts ((attachments != '[]'::jsonb));

-- Create storage bucket for prompt attachments
-- Note: This uses Supabase storage API. Run via dashboard if this fails.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompt-attachments',
  'prompt-attachments',
  true,  -- Public read access for LLM API consumption
  52428800,  -- 50MB max file size
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies

-- Users can upload to their own folder
CREATE POLICY "Users can upload prompt attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prompt-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can read attachments (needed for LLM API access)
CREATE POLICY "Public read access for prompt attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'prompt-attachments');

-- Users can delete their own attachments
CREATE POLICY "Users can delete own prompt attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prompt-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own attachments
CREATE POLICY "Users can update own prompt attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prompt-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add comment for documentation
COMMENT ON COLUMN prompts.attachments IS 'JSON array of attachment objects with fields: id, type, filename, storage_path, public_url, mime_type, size_bytes, extracted_text';
