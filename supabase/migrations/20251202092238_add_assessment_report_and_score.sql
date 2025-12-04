/*
  # Add Assessment Report and Score Fields

  1. Changes
    - Add `assessment_report_url` (text, nullable) - URL to the uploaded assessment report
    - Add `assessment_report_name` (text, nullable) - Original filename of the assessment report
    - Add `assessment_score` (text, nullable) - Assessment score entered by recruiter

  2. Notes
    - These fields support Phase 2: Online Assessment
    - Assessment report can be PDF, Word, or image files
    - Score is stored as text to allow flexible formats (e.g., "85/100", "A+", "Pass")
*/

-- Add assessment report and score columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'assessment_report_url'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN assessment_report_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'assessment_report_name'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN assessment_report_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'assessment_score'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN assessment_score text;
  END IF;
END $$;
