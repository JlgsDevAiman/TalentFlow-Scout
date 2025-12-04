/*
  # Create Candidates Table for TalentFlow Scout

  1. New Tables
    - `candidates`
      - `id` (uuid, primary key) - Unique identifier for each candidate
      - `full_name` (text) - Candidate's full name
      - `email` (text) - Candidate's email address
      - `phone` (text) - Candidate's phone number
      - `position_applied` (text) - Position the candidate applied for
      - `years_experience` (integer, default 0) - Number of years of experience
      - `status` (text, default 'New') - Application status (New, Shortlisted, Rejected, Hired)
      - `notes` (text, default '') - Additional notes about the candidate
      - `ai_fit_score` (integer) - AI-generated fit score (0-100)
      - `ai_fit_comment` (text) - AI-generated fit comment
      - `created_at` (timestamptz) - Timestamp when candidate was added
      - `user_id` (uuid) - Foreign key to auth.users (HR user who added the candidate)

  2. Security
    - Enable RLS on `candidates` table
    - Add policy for authenticated users to read their own candidates
    - Add policy for authenticated users to insert their own candidates
    - Add policy for authenticated users to update their own candidates
    - Add policy for authenticated users to delete their own candidates

  3. Important Notes
    - All candidates are owned by the HR user who created them
    - RLS ensures users can only access their own candidate data
    - Status field has default value to ensure data integrity
*/

CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  position_applied text NOT NULL,
  years_experience integer DEFAULT 0,
  status text DEFAULT 'New',
  notes text DEFAULT '',
  ai_fit_score integer,
  ai_fit_comment text,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own candidates"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own candidates"
  ON candidates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own candidates"
  ON candidates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS candidates_user_id_idx ON candidates(user_id);
CREATE INDEX IF NOT EXISTS candidates_status_idx ON candidates(status);
CREATE INDEX IF NOT EXISTS candidates_created_at_idx ON candidates(created_at DESC);
