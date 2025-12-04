# Phase 3: Background Check Testing Guide

## Overview
Phase 3 focuses on managing background checks for candidates who have completed their online assessments. This phase is critical for ensuring candidate eligibility before proceeding to salary negotiations.

## Prerequisites
Before testing Phase 3, ensure:
1. You are logged in as an admin user
2. A candidate exists in the system with `current_step = 'Selected for Hiring'`
3. The candidate has `assessment_status = 'Completed'`
4. The candidate has `background_check_status = 'Pending'`

## Testing Steps

### Step 1: Complete Phase 2 (Assessment)
If you need to set up a candidate for Phase 3 testing:

1. Navigate to Admin Dashboard → Hiring Approval
2. Find or create a candidate with status "Selected for Hiring"
3. Expand the candidate details
4. In Phase 2 section:
   - Enter candidate email
   - Click "Preview" to review assessment notification email
   - Click "Send Email" to send the assessment invitation
5. Click "Mark Assessment Complete" button
6. Verify the candidate's `assessment_status` changes to "Completed"
7. Verify the candidate's `current_step` changes to "Assessment Completed"

### Step 2: Test Background Check Phase

#### 2.1 View Background Check Section
1. Expand the candidate details
2. Locate "Phase 3: Background Check" section
3. Verify the section displays:
   - Current status (should show "Pending" in orange)
   - "Mark Background Check Complete" button (enabled only if assessment is completed)

#### 2.2 Mark Background Check as Complete
1. Click "Mark Background Check Complete" button
2. System should:
   - Update `background_check_status` to "Completed"
   - Update `current_step` to "Background Check Completed"
   - Refresh the candidate list
   - Show success alert: "Background check marked as completed!"

#### 2.3 Verify Status Updates
1. Check the candidate's main row displays:
   - Current Step badge shows "Background Check Completed"
   - Progress bar shows increased completion percentage
   - Status column shows green checkmark for "BG Check Done"

#### 2.4 Verify Phase 4 Unlock
1. After marking background check complete, verify:
   - Phase 4 section (Salary Package Preparation) becomes visible
   - "Prepare Salary Package" button is enabled
   - Both Assessment and Background Check show green "Completed" status

## Expected Results

### Database Updates
```sql
-- After marking background check complete:
SELECT
  name,
  current_step,
  assessment_status,
  background_check_status
FROM candidate_hiring_flow
WHERE candidate_id = '[test-candidate-id]';

-- Expected result:
-- current_step: 'Background Check Completed'
-- assessment_status: 'Completed'
-- background_check_status: 'Completed'
```

### UI Updates
- ✅ Status badge changes to "Background Check Completed"
- ✅ Progress bar advances to ~60% completion
- ✅ Green checkmark appears in Status column
- ✅ Phase 4 section becomes visible
- ✅ Button is disabled while processing

## Error Scenarios to Test

### Test 1: Background Check Before Assessment
**Setup:**
- Candidate with `assessment_status = 'Pending'`

**Expected:**
- "Mark Background Check Complete" button should NOT be visible
- Only Phase 2 (Assessment) section should be interactive

### Test 2: Multiple Click Prevention
**Setup:**
- Click "Mark Background Check Complete" rapidly multiple times

**Expected:**
- Button should disable immediately after first click
- Only one update request should be sent
- Status should update only once

### Test 3: Permission Check
**Setup:**
- Log in as non-admin user (if applicable)

**Expected:**
- Should not be able to access Hiring Approval view
- Or should not see action buttons

## Integration Points

### Phase 2 → Phase 3 Flow
- Assessment completion automatically enables background check phase
- No manual intervention needed to unlock Phase 3

### Phase 3 → Phase 4 Flow
- Background check completion automatically unlocks salary package preparation
- Both Assessment AND Background Check must be completed
- Current step must be "Background Check Completed"

## Workflow State Machine

```
Selected for Hiring
    ↓
[Phase 2: Send Assessment]
    ↓
Assessment Completed
    ↓
[Phase 3: Background Check]
    ↓
Background Check Completed
    ↓
[Phase 4: Salary Package]
    ↓
...
```

## Testing Checklist

- [ ] Can view Phase 3 section after assessment completion
- [ ] Background check button is disabled until assessment completes
- [ ] Can successfully mark background check as complete
- [ ] Status updates correctly in database
- [ ] UI reflects status change immediately
- [ ] Progress bar updates appropriately
- [ ] Phase 4 becomes available after completion
- [ ] Cannot proceed to Phase 4 without completing Phase 3
- [ ] Button disables during processing
- [ ] Success/error messages display correctly

## Common Issues

### Issue: Button Not Appearing
**Cause:** Assessment not marked as complete
**Solution:** Complete Phase 2 first

### Issue: Database Not Updating
**Cause:** RLS policy or permission issue
**Solution:** Verify user is authenticated and has proper permissions

### Issue: Phase 4 Not Appearing
**Cause:** Both assessment and background check must be completed
**Solution:** Verify both statuses are "Completed" and current_step is "Background Check Completed"

## Notes
- Background check is currently a manual process - the system only tracks status
- In future iterations, this could integrate with third-party background check services
- The system assumes background checks are performed externally
- This phase is a checkpoint to ensure due diligence before salary negotiations
