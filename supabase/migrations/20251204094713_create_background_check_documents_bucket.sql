/*
  # Create Background Check Documents Storage Bucket

  1. New Storage Bucket
    - `background-check-documents` - For storing background check reports
  
  2. Security
    - Authenticated users can upload files
    - Authenticated users can read files
    - Authenticated users can delete files
*/

-- Create storage bucket for background check documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-check-documents', 'background-check-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload background check documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read background check documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update background check documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete background check documents" ON storage.objects;

-- Allow authenticated users to upload background check documents
CREATE POLICY "Authenticated users can upload background check documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'background-check-documents');

-- Allow authenticated users to read background check documents
CREATE POLICY "Authenticated users can read background check documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'background-check-documents');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update background check documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'background-check-documents')
WITH CHECK (bucket_id = 'background-check-documents');

-- Allow authenticated users to delete background check documents
CREATE POLICY "Authenticated users can delete background check documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'background-check-documents');
