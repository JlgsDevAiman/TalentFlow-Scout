/*
  # Add Background Check Document Field

  1. Changes
    - Add `background_check_document_url` field to `candidate_hiring_flow` table
    - Add `background_check_document_name` field to store original filename
    - Add `background_check_completed_at` timestamp field
  
  2. Notes
    - Background check is optional
    - Can be completed with or without uploading a document
    - Document URL points to Supabase storage
*/

-- Add background check document fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'background_check_document_url'
  ) THEN
    ALTER TABLE candidate_hiring_flow 
    ADD COLUMN background_check_document_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'background_check_document_name'
  ) THEN
    ALTER TABLE candidate_hiring_flow 
    ADD COLUMN background_check_document_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'background_check_completed_at'
  ) THEN
    ALTER TABLE candidate_hiring_flow 
    ADD COLUMN background_check_completed_at timestamptz;
  END IF;
END $$;
