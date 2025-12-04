/*
  # Add Approval History and Document Storage

  1. New Tables
    - `approval_history`
      - `id` (uuid, primary key)
      - `candidate_id` (uuid, foreign key to candidates)
      - `approver_id` (uuid, foreign key to profiles)
      - `approval_type` (text) - Verified by, Recommended by, Approved by
      - `status` (text) - Pending, Approved, Rejected
      - `comments` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Changes to candidates table
    - `assessment_file_path` (text)
    - `assessment_file_name` (text)
    - `background_check_file_path` (text)
    - `background_check_file_name` (text)
  
  3. Security
    - Enable RLS on approval_history table
    - Policies for authenticated users
*/

-- Create approval_history table
CREATE TABLE IF NOT EXISTS approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  approver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approval_type text NOT NULL CHECK (approval_type IN ('Verified by', 'Recommended by', 'Approved by')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add document fields to candidates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'assessment_file_path'
  ) THEN
    ALTER TABLE candidates ADD COLUMN assessment_file_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'assessment_file_name'
  ) THEN
    ALTER TABLE candidates ADD COLUMN assessment_file_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'background_check_file_path'
  ) THEN
    ALTER TABLE candidates ADD COLUMN background_check_file_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'background_check_file_name'
  ) THEN
    ALTER TABLE candidates ADD COLUMN background_check_file_name text;
  END IF;
END $$;

-- Enable RLS on approval_history
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- Policies for approval_history
CREATE POLICY "Authenticated users can view approval history"
  ON approval_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create approval requests"
  ON approval_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own approval records"
  ON approval_history
  FOR UPDATE
  TO authenticated
  USING (approver_id = auth.uid())
  WITH CHECK (approver_id = auth.uid());

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_approval_history_candidate_id ON approval_history(candidate_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_approver_id ON approval_history(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_status ON approval_history(status);