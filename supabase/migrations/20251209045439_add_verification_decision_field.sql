/*
  # Add Verification Decision Field

  1. Changes
    - Add verification_decision field to candidate_hiring_flow table to store verifier's decision
    - Add verification_decision_at timestamp to track when decision was made
    - Add verification_comments field to store verifier's comments

  2. Security
    - No RLS changes needed as this uses existing table policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'verification_decision'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN verification_decision text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'verification_decision_at'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN verification_decision_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'verification_comments'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN verification_comments text;
  END IF;
END $$;