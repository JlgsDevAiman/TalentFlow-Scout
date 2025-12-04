/*
  # Create Approvers Table

  1. New Tables
    - `approvers`
      - `id` (uuid, primary key) - Unique identifier for each approver
      - `user_id` (uuid, foreign key) - References auth.users
      - `role` (text) - Approver role (e.g., "Prepared by", "Recommended by", "Jointly Approved")
      - `designation` (text) - Job title/designation (e.g., "Manager, Group Human Resources")
      - `created_at` (timestamptz) - When the approver was added
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `approvers` table
    - Add policy for authenticated users to read approvers
    - Add policy for admins to manage approvers

  3. Notes
    - Supports multi-level approval workflow
    - Links approvers to user accounts for authentication
    - Stores role and designation for approval hierarchy
*/

CREATE TABLE IF NOT EXISTS approvers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  designation text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE approvers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view approvers
CREATE POLICY "Authenticated users can view approvers"
  ON approvers
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert approvers
CREATE POLICY "Admins can insert approvers"
  ON approvers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update approvers
CREATE POLICY "Admins can update approvers"
  ON approvers
  FOR UPDATE
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

-- Policy: Only admins can delete approvers
CREATE POLICY "Admins can delete approvers"
  ON approvers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_approvers_user_id ON approvers(user_id);
CREATE INDEX IF NOT EXISTS idx_approvers_role ON approvers(role);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_approvers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_approvers_updated_at
  BEFORE UPDATE ON approvers
  FOR EACH ROW
  EXECUTE FUNCTION update_approvers_updated_at();