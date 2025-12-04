# Phase 4: Salary Package Preparation Testing Guide

## Overview
Phase 4 focuses on generating AI-powered salary package proposals for candidates who have completed both assessment and background check phases. This phase uses OpenAI GPT to create competitive, market-aligned compensation packages.

## Prerequisites
Before testing Phase 4, ensure:
1. You are logged in as an admin user
2. OpenAI API key is configured in `.env` file as `VITE_OPENAI_API_KEY`
3. A candidate exists with:
   - `assessment_status = 'Completed'`
   - `background_check_status = 'Completed'`
   - `current_step = 'Background Check Completed'`

## Testing Steps

### Step 1: Access Phase 4
1. Navigate to Admin Dashboard → Hiring Approval tab
2. Find a candidate who has completed both Phase 2 (Assessment) and Phase 3 (Background Check)
3. Expand the candidate details by clicking the expand icon
4. Scroll to Phase 4 section which should now be visible

### Step 2: Open Salary Package Form
1. Locate "Phase 4: Salary Package Preparation" section
2. Click the "Prepare Salary Package" button
3. Verify the form appears with the following fields:
   - Position Title (pre-filled with candidate's position)
   - Years of Experience (required field)
   - Upload CV (optional file input)
   - Additional Notes (optional textarea)

### Step 3: Fill Out the Form

#### 3.1 Basic Information
1. **Position Title**: Verify it shows the candidate's position, edit if needed
2. **Years of Experience**: Enter the candidate's experience (e.g., "5 years", "7-8 years")
   - This field is REQUIRED for AI generation

#### 3.2 Optional CV Upload
1. Click "Choose CV file" button
2. Select a PDF, DOC, or DOCX file containing the candidate's CV
3. Verify the filename appears in the button label
4. Note: CV upload is optional but helps AI generate more accurate packages

#### 3.3 Additional Notes
1. Add any specific requirements or considerations:
   - Budget constraints
   - Special allowances needed
   - Market positioning requirements
   - Company policies to consider

### Step 4: Generate Salary Package

#### 4.1 Validation
1. Try clicking "Generate with AI" without filling Years of Experience
2. Verify the button is disabled
3. Fill in Years of Experience
4. Button should become enabled

#### 4.2 Generate with AI
1. Click "Generate with AI" button
2. Observe loading state:
   - Button shows "Generating..." with spinning icon
   - Button is disabled during generation
   - Cancel button is also disabled
3. Wait for AI to generate the package (typically 5-10 seconds)

#### 4.3 Success Handling
1. Upon successful generation:
   - Success alert appears: "Salary package generated and saved successfully!"
   - Form closes automatically
   - Candidate list refreshes
   - Salary Package preview section appears

### Step 5: Review Generated Package

After generation, you should see a green "Salary Package Generated" section with:

#### 5.1 Base Salary
- Annual base salary amount in Malaysian Ringgit (MYR)
- Example: "RM 120,000 per annum"

#### 5.2 Total Annual Package
- Displayed prominently in large green text
- Includes base salary + all allowances and benefits
- Example: "RM 156,000"

#### 5.3 Benefits List
- Comprehensive list of employee benefits
- Each benefit shown with a green checkmark
- Examples:
  - Medical insurance
  - Annual leave (XX days)
  - Performance bonus
  - EPF & SOCSO contributions
  - Professional development allowance

### Step 6: Verify Database Updates

Check that the salary proposal was saved correctly:

```sql
SELECT
  name,
  position,
  current_step,
  salary_proposal
FROM candidate_hiring_flow
WHERE candidate_id = '[test-candidate-id]';

-- Expected result:
-- current_step: 'Salary Package Prepared'
-- salary_proposal: {JSON object with salary details}
```

## Expected Salary Package Structure

The AI-generated package should include:

```json
{
  "base_salary": "RM XXX,XXX per annum",
  "allowances": {
    "housing": "RM X,XXX per month",
    "transport": "RM X,XXX per month",
    "meal": "RM XXX per month",
    "other": "RM X,XXX per month"
  },
  "benefits": [
    "Medical insurance",
    "Annual leave (XX days)",
    "Performance bonus (up to X months)",
    "EPF & SOCSO statutory contributions",
    "Professional development budget",
    "Flexible working arrangements"
  ],
  "total_annual_package": "RM XXX,XXX",
  "justification": "Explanation of package rationale based on experience and market",
  "market_comparison": "How this compares to industry standards"
}
```

## Error Scenarios to Test

### Test 1: Missing OpenAI API Key
**Setup:**
- Remove or invalidate `VITE_OPENAI_API_KEY` in `.env`

**Expected:**
- Error alert: "OpenAI API key not configured"
- Form remains open for correction

### Test 2: Missing Required Field
**Setup:**
- Leave "Years of Experience" empty

**Expected:**
- "Generate with AI" button remains disabled
- Cannot proceed with generation

### Test 3: Invalid File Upload
**Setup:**
- Try uploading a non-supported file type (e.g., .txt, .xlsx)

**Expected:**
- File picker should only show .pdf, .doc, .docx files
- Invalid files should be rejected

### Test 4: API Request Failure
**Setup:**
- Use invalid OpenAI API key or trigger rate limit

**Expected:**
- Error alert with descriptive message
- Form remains open for retry
- No partial data saved to database

### Test 5: Cancel Form
**Setup:**
- Open salary package form
- Fill in some fields
- Click "Cancel" button

**Expected:**
- Form closes immediately
- No data is saved
- Can reopen form with fresh state

## Integration Points

### Phase 3 → Phase 4 Flow
- Both Assessment AND Background Check must be completed
- Phase 4 only appears after `current_step = 'Background Check Completed'`
- Background check completion automatically unlocks Phase 4

### Phase 4 → Phase 5 Flow
- After salary package is generated and saved
- Current step updates to `'Salary Package Prepared'`
- Ready for verification and approval phases
- Salary proposal stored in `salary_proposal` JSONB field

## AI Generation Quality Checks

Verify the AI-generated package is:

### ✅ Realistic and Market-Aligned
- Base salary appropriate for position and experience
- Total package competitive for Malaysian market
- Allowances follow standard industry practices

### ✅ Comprehensive
- Includes all major compensation components
- Benefits list is detailed and specific
- Allowances broken down by category

### ✅ Well-Justified
- Justification explains the package rationale
- Market comparison provides context
- Experience level is reflected in compensation

### ✅ Properly Formatted
- All amounts in Malaysian Ringgit (MYR)
- Consistent formatting across fields
- Valid JSON structure

## Common Issues

### Issue: "Generate with AI" Button Disabled
**Cause:** Years of Experience field is empty
**Solution:** Fill in the required field

### Issue: Generation Takes Too Long
**Cause:** OpenAI API slow response or network issues
**Solution:** Wait up to 30 seconds; if timeout, try again

### Issue: Package Not Appearing After Generation
**Cause:** Database update failed or page didn't refresh
**Solution:** Manually refresh the candidate list using the refresh button

### Issue: Unrealistic Salary Amounts
**Cause:** AI generated amounts based on limited context
**Solution:**
- Provide more detailed notes
- Upload comprehensive CV
- Regenerate with better inputs

## Testing Checklist

- [ ] Can access Phase 4 after completing Phase 3
- [ ] Form appears with all required fields
- [ ] Position pre-fills correctly
- [ ] Years of Experience field is required
- [ ] CV upload accepts PDF, DOC, DOCX files
- [ ] Additional notes textarea works
- [ ] Generate button is disabled without required fields
- [ ] Loading state shows during generation
- [ ] Success message appears after generation
- [ ] Form closes automatically on success
- [ ] Generated package displays correctly
- [ ] Base salary is shown
- [ ] Total annual package is highlighted
- [ ] Benefits list is complete
- [ ] Database updates with salary_proposal
- [ ] current_step updates to "Salary Package Prepared"
- [ ] Cancel button closes form without saving
- [ ] Can regenerate package if needed

## Performance Expectations

- **Form Load Time**: Instant
- **AI Generation Time**: 5-15 seconds
- **Database Save Time**: < 1 second
- **Total Process Time**: 6-20 seconds

## Notes

- The AI uses GPT-4o-mini model for cost-effective generation
- Salary packages are based on Malaysian market standards
- CV content is limited to 1000 characters for AI processing
- Packages can be regenerated if unsatisfactory
- The justification and market comparison provide transparency
- Generated packages should always be reviewed by HR before presenting to candidates

## Future Enhancements

Potential improvements for Phase 4:
- Manual editing of generated packages
- Multiple package options (low/mid/high range)
- Historical salary data integration
- Industry-specific benchmarking
- Benefits customization based on company policies
- Export package as PDF for candidate presentation
