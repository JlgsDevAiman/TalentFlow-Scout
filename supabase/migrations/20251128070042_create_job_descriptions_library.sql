/*
  # Create Job Descriptions Library

  1. New Table: job_descriptions
    - `id` (uuid, primary key) - Unique identifier
    - `title` (text) - Job title/position name
    - `description` (text) - Full job description content
    - `department` (text, nullable) - Department/division
    - `location` (text, nullable) - Job location
    - `file_path` (text, nullable) - Storage path for original JD file
    - `file_name` (text, nullable) - Original filename
    - `file_size` (integer, nullable) - File size in bytes
    - `file_type` (text, nullable) - MIME type
    - `is_active` (boolean) - Whether JD is currently active
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `created_by` (uuid, foreign key) - User who created the JD

  2. Security
    - Enable RLS on job_descriptions table
    - Authenticated users can read all active JDs
    - Only admins can create, update, or delete JDs

  3. Indexes
    - Index on title for search
    - Index on is_active for filtering
    - Index on created_by for user queries
*/

-- Create job_descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  department text,
  location text,
  file_path text,
  file_name text,
  file_size integer,
  file_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all active job descriptions
CREATE POLICY "Authenticated users can read active job descriptions"
ON job_descriptions FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can read all job descriptions (active and inactive)
CREATE POLICY "Admins can read all job descriptions"
ON job_descriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can insert job descriptions
CREATE POLICY "Admins can insert job descriptions"
ON job_descriptions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can update job descriptions
CREATE POLICY "Admins can update job descriptions"
ON job_descriptions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete job descriptions
CREATE POLICY "Admins can delete job descriptions"
ON job_descriptions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS job_descriptions_title_idx ON job_descriptions(title);
CREATE INDEX IF NOT EXISTS job_descriptions_is_active_idx ON job_descriptions(is_active);
CREATE INDEX IF NOT EXISTS job_descriptions_created_by_idx ON job_descriptions(created_by);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_descriptions_updated_at
  BEFORE UPDATE ON job_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_job_descriptions_updated_at();
