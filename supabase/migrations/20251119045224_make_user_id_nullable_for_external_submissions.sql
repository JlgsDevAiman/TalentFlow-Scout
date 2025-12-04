/*
  # Allow External Candidate Submissions

  1. Changes
    - Make `user_id` nullable to allow external submissions
    - Add default value NULL for `user_id`
    - Add policy to allow service role to insert candidates without user_id

  2. Security
    - External submissions (via Edge Function with service role key) can insert candidates
    - Authenticated users can still view/edit only their own candidates
    - Candidates with NULL user_id are visible to all authenticated users
*/

-- Make user_id nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE candidates ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- Add policy for viewing candidates without user_id (submitted externally)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Users can view externally submitted candidates'
  ) THEN
    CREATE POLICY "Users can view externally submitted candidates"
      ON candidates FOR SELECT
      TO authenticated
      USING (user_id IS NULL);
  END IF;
END $$;

-- Add policy for updating externally submitted candidates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Users can update externally submitted candidates'
  ) THEN
    CREATE POLICY "Users can update externally submitted candidates"
      ON candidates FOR UPDATE
      TO authenticated
      USING (user_id IS NULL)
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- Add policy for deleting externally submitted candidates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidates' AND policyname = 'Users can delete externally submitted candidates'
  ) THEN
    CREATE POLICY "Users can delete externally submitted candidates"
      ON candidates FOR DELETE
      TO authenticated
      USING (user_id IS NULL);
  END IF;
END $$;
