/*
  # Add Position, Grade, and Last Drawn Salary Fields

  1. Changes
    - Add `position_level` field to candidate_hiring_flow table
    - Add `grade` field to candidate_hiring_flow table
    - Add `last_drawn_salary` field to candidate_hiring_flow table
    - These fields support the enhanced salary package preparation form

  2. Details
    - `position_level`: Text field for position (SVP, VP, Manager, etc.)
    - `grade`: Text field for grade (E2-E11, NE1, NE2, NEG)
    - `last_drawn_salary`: Numeric field for candidate's last drawn salary

  3. Notes
    - Fields are nullable to support existing records
    - New submissions should include these fields for comprehensive salary analysis
*/

DO $$
BEGIN
  -- Add position_level column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'position_level'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN position_level text;
  END IF;

  -- Add grade column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'grade'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN grade text;
  END IF;

  -- Add last_drawn_salary column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_hiring_flow' AND column_name = 'last_drawn_salary'
  ) THEN
    ALTER TABLE candidate_hiring_flow ADD COLUMN last_drawn_salary numeric;
  END IF;
END $$;
