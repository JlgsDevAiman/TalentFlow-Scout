/*
  # Create Job Descriptions Storage Bucket

  1. Storage Bucket Setup
    - Create private bucket named "job-descriptions"
    - Configure bucket for authenticated user access only
    - Set file size limits and allowed MIME types

  2. Security Policies
    - Users can upload files to their own user-scoped paths
    - Users can read only their own uploaded files
    - Users can delete only their own uploaded files
    - Users can update only their own uploaded files

  3. Notes
    - Maximum file size: 10MB (enforced at application level)
    - Allowed types: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG
    - Files are organized by user_id for isolation
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-descriptions',
  'job-descriptions',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload files to their own user directory
CREATE POLICY "Users can upload job descriptions to own directory"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read own job descriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own job descriptions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own job descriptions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
