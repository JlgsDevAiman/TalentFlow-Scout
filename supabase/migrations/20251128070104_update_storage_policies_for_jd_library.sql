/*
  # Update Storage Policies for JD Library

  1. Updates to job-descriptions bucket
    - Admins can upload JD files to library folder
    - Admins can read all JD files
    - Admins can update all JD files
    - Admins can delete all JD files

  2. Notes
    - JD library files stored in 'library/' folder
    - User-uploaded candidate JD files remain in user-specific folders
*/

-- Policy: Admins can upload JD files to library folder
CREATE POLICY "Admins can upload to library folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = 'library' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can read library JD files
CREATE POLICY "Admins can read library job descriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = 'library' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: All authenticated users can read library JD files
CREATE POLICY "Users can read library job descriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = 'library'
);

-- Policy: Admins can update library JD files
CREATE POLICY "Admins can update library job descriptions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = 'library' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = 'library' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can delete library JD files
CREATE POLICY "Admins can delete library job descriptions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = 'library' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
