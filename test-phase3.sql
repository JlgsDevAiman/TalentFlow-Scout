-- Phase 3 Testing SQL Script
-- This script helps verify Phase 3 functionality

-- 1. Check existing candidates and their statuses
SELECT
  candidate_id,
  name,
  position,
  current_step,
  assessment_status,
  background_check_status,
  created_at
FROM candidate_hiring_flow
ORDER BY created_at DESC
LIMIT 10;

-- 2. Find candidates ready for Phase 3 (assessment completed, background check pending)
SELECT
  candidate_id,
  name,
  position,
  current_step,
  assessment_status,
  background_check_status
FROM candidate_hiring_flow
WHERE assessment_status = 'Completed'
  AND background_check_status = 'Pending'
ORDER BY created_at DESC;

-- 3. Find candidates who have completed Phase 3
SELECT
  candidate_id,
  name,
  position,
  current_step,
  assessment_status,
  background_check_status,
  updated_at
FROM candidate_hiring_flow
WHERE background_check_status = 'Completed'
ORDER BY updated_at DESC;

-- 4. Create a test candidate ready for Phase 3 (if needed for testing)
-- Uncomment and modify the values as needed:
/*
INSERT INTO candidate_hiring_flow (
  name,
  position,
  recruiter,
  recruiter_email,
  hiring_manager1_email,
  approver1_email,
  current_step,
  assessment_status,
  background_check_status
) VALUES (
  'Test Candidate Phase 3',
  'Senior Software Engineer',
  'Test Recruiter',
  'recruiter@test.com',
  'hm1@test.com',
  'approver1@test.com',
  'Assessment Completed',
  'Completed',
  'Pending'
);
*/

-- 5. Manually complete background check for testing (simulate the button click)
-- Replace 'candidate-id-here' with actual candidate_id
/*
UPDATE candidate_hiring_flow
SET
  background_check_status = 'Completed',
  current_step = 'Background Check Completed',
  updated_at = now()
WHERE candidate_id = 'candidate-id-here';
*/

-- 6. Verify the update worked
/*
SELECT
  candidate_id,
  name,
  current_step,
  assessment_status,
  background_check_status,
  updated_at
FROM candidate_hiring_flow
WHERE candidate_id = 'candidate-id-here';
*/

-- 7. Check workflow progression stats
SELECT
  current_step,
  COUNT(*) as candidate_count,
  COUNT(*) FILTER (WHERE assessment_status = 'Completed') as assessment_completed,
  COUNT(*) FILTER (WHERE background_check_status = 'Completed') as background_check_completed
FROM candidate_hiring_flow
GROUP BY current_step
ORDER BY
  CASE current_step
    WHEN 'Selected for Hiring' THEN 1
    WHEN 'Assessment Completed' THEN 2
    WHEN 'Background Check Completed' THEN 3
    WHEN 'Salary Package Prepared' THEN 4
    ELSE 99
  END;

-- 8. Find candidates stuck in Phase 3 (assessment complete but background check not started)
SELECT
  candidate_id,
  name,
  position,
  recruiter_email,
  current_step,
  assessment_status,
  background_check_status,
  EXTRACT(DAY FROM (now() - updated_at)) as days_in_current_status
FROM candidate_hiring_flow
WHERE assessment_status = 'Completed'
  AND background_check_status = 'Pending'
  AND EXTRACT(DAY FROM (now() - updated_at)) > 3
ORDER BY updated_at ASC;
