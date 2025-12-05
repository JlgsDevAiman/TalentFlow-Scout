/*
  # Add AI Position Recommendation Fields to Candidates

  1. New Columns
    - `ai_recommended_position` (text) - The AI's recommended job position title for the candidate
    - `ai_recommended_position_id` (uuid) - Foreign key reference to the recommended job description (nullable)
    - `ai_all_position_scores` (jsonb) - JSON array storing scores for all positions evaluated by AI
  
  2. Changes
    - These fields support the multi-position AI scoring feature
    - ai_all_position_scores stores detailed scoring data for all evaluated positions
    - Allows tracking which position is the best fit and why
  
  3. Security
    - No RLS changes needed as these are internal scoring fields
*/

-- Add AI recommended position fields
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS ai_recommended_position text,
ADD COLUMN IF NOT EXISTS ai_recommended_position_id uuid,
ADD COLUMN IF NOT EXISTS ai_all_position_scores jsonb DEFAULT '[]'::jsonb;