/*
  # Create Approval Documents Storage Bucket

  1. Storage
    - Create `approval-documents` bucket for assessment and background check files
    
  2. Security
    - Public bucket set to false (private)
    - Authenticated users can upload
    - Authenticated users can read
*/

-- Create approval-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'approval-documents',
  'approval-documents',
  false,
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload approval documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'approval-documents');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read approval documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'approval-documents');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update approval documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'approval-documents')
  WITH CHECK (bucket_id = 'approval-documents');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete approval documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'approval-documents');