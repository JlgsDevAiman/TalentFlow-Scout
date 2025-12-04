-- Quick Setup Script to Test Phase 4: Salary Package Preparation
-- This script moves a candidate through Phase 2 and Phase 3 to unlock Phase 4

-- Select the first candidate (Syafrina Kamaruzaman) and advance to Phase 4 readiness
UPDATE candidate_hiring_flow
SET
  assessment_status = 'Completed',
  background_check_status = 'Completed',
  current_step = 'Background Check Completed',
  updated_at = NOW()
WHERE candidate_id = 'f2619425-ffab-4a65-bdaf-1708d14efc9d';

-- Verify the update
SELECT
  name,
  position,
  current_step,
  assessment_status,
  background_check_status
FROM candidate_hiring_flow
WHERE candidate_id = 'f2619425-ffab-4a65-bdaf-1708d14efc9d';

-- EXPECTED RESULT:
-- name: "Syafrina Kamaruzaman"
-- position: "Manager, Human Resource / HRBP"
-- current_step: "Background Check Completed"
-- assessment_status: "Completed"
-- background_check_status: "Completed"

-- Now you can see Phase 4 in the Hiring Approval view for this candidate!
