/*
  # Create Assessment Reports Storage Bucket

  1. New Storage Bucket
    - `assessment-reports` - For storing assessment report files
  
  2. Security
    - Authenticated users can upload files
    - Authenticated users can read files
    - Authenticated users can delete files
*/

-- Create storage bucket for assessment reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('assessment-reports', 'assessment-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload assessment reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read assessment reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update assessment reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete assessment reports" ON storage.objects;

-- Allow authenticated users to upload assessment reports
CREATE POLICY "Authenticated users can upload assessment reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assessment-reports');

-- Allow authenticated users to read assessment reports
CREATE POLICY "Authenticated users can read assessment reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assessment-reports');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update assessment reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'assessment-reports')
WITH CHECK (bucket_id = 'assessment-reports');

-- Allow authenticated users to delete assessment reports
CREATE POLICY "Authenticated users can delete assessment reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'assessment-reports');
