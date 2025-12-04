/*
  # Add Position Recommendation Fields to Candidates

  1. Changes to Candidates Table
    - `ai_recommended_position` (text, nullable) - Best matching position title
    - `ai_recommended_position_id` (uuid, nullable) - FK to job_descriptions table
    - `ai_all_position_scores` (jsonb, nullable) - All position match scores and reasons

  2. Indexing
    - Add index on ai_recommended_position_id for efficient lookups

  3. Notes
    - These fields store AI-generated position recommendations
    - All fields are nullable for backward compatibility
*/

-- Add position recommendation fields to candidates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'ai_recommended_position'
  ) THEN
    ALTER TABLE candidates ADD COLUMN ai_recommended_position text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'ai_recommended_position_id'
  ) THEN
    ALTER TABLE candidates ADD COLUMN ai_recommended_position_id uuid REFERENCES job_descriptions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'ai_all_position_scores'
  ) THEN
    ALTER TABLE candidates ADD COLUMN ai_all_position_scores jsonb;
  END IF;
END $$;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS candidates_ai_recommended_position_id_idx 
ON candidates(ai_recommended_position_id) 
WHERE ai_recommended_position_id IS NOT NULL;
