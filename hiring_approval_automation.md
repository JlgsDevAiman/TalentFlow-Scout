# Hiring Approval Automation — Full Workflow Specification (.md)
## For Bolt.new + Supabase + Power Automate + OpenAI

---

# 🟦 Project Overview

This automation manages the end-to-end hiring approval process from “Selected for Hiring” until “Contract Issuance,” using:

- **Bolt.new** – Candidate interface, status updates  
- **Supabase** – Database for workflow tracking  
- **Power Automate** – Email-based approvals, notifications, triggers  
- **OpenAI GPT** – Auto-generate summaries, salary package drafts, messages  

Manual steps (Background Check, Contract Issuance) remain in the flow but are not automated.

---

# 🟩 Supabase Table Structure (`candidate_hiring_flow`)

| Field | Type | Description |
|-------|--------|-------------|
| candidate_id | UUID | Primary key |
| name | text | Candidate name |
| position | text | Job role applied |
| recruiter | text | Recruiter name |
| recruiter_email | text | Recruiter email |
| hiring_manager1_email | text | Mandatory recommender |
| hiring_manager2_email | text | Optional recommender |
| approver1_email | text | Mandatory approver |
| approver2_email | text | Optional approver |
| current_step | text | Step name |
| step_status | jsonb | Stores multi-step statuses |
| assessment_status | text | Pending / Completed |
| background_check_status | text | Pending / Completed |
| salary_proposal | jsonb | Drafted salary proposal |
| approvals | jsonb | Stores decisions (HM1, HM2, Approver1, Approver2) |
| created_at | timestamp | Auto |
| updated_at | timestamp | Auto |

---

# 🟦 PHASE 1 — Build Candidate Entry Form in Bolt.new

### Objective  
Create the initial interface for recruiters to log candidates selected for hiring.

### Components  
A Bolt.new form with fields:
- Name  
- Position  
- Recruiter Name + Email  
- Hiring Manager 1 Email  
- Hiring Manager 2 Email (optional)  
- Approver 1 Email  
- Approver 2 Email (optional)

### Action  
On submit:
- Write a new record to Supabase table `candidate_hiring_flow`
- Set:
```
current_step = "Selected for Hiring"
```

---

# 🟦 PHASE 2 — Automate Online Assessment Notification

### Trigger  
`current_step = "Selected for Hiring"`

### Flow  
1. Power Automate detects status  
2. GPT generates candidate instruction message  
3. Auto-email sent containing:
   - Assessment link: https://assessments-dashboard.foundit.in/login  
   - Instructions  
   - Deadline  
4. 48‑hour reminder if `assessment_status != "Completed"`

### Recruiter Action  
Recruiter updates:
```
assessment_status = "Completed"
current_step = "Assessment Completed"
```

---

# 🟦 PHASE 3 — Background Check (Manual)

Recruiter updates Supabase:
```
background_check_status = "Completed"
current_step = "Background Check Completed"
```

---

# 🟦 PHASE 4 — AI Salary Package Generation

### Objective  
Generate salary proposal using GPT.

### Flow  
1. Recruiter uploads CV & notes.  
2. Bolt.new sends content to OpenAI.  
3. GPT outputs structured salary proposal.  
4. Recruiter accepts and Bolt writes to Supabase:
```
salary_proposal = {...}
current_step = "Salary Package Prepared"
```

---

# 🟦 PHASE 5 — Verification by Head, Talent Strategy (Email-Based)

### Trigger  
```
current_step = "Ready for Verification – Head, Talent Strategy"
```

### Power Automate Action  
Sends approval email with:
- Candidate summary  
- Assessment & background check results  
- Salary proposal  

### Email Buttons  
- Approve  
- Reject  
- Request Change  

### On Response  
Stored as:
```
approvals.verifier = { decision, comment }
```

Recruiter notified and updates:
```
current_step = "Ready for Recommendation – Hiring Manager 1"
```

---

# 🟦 PHASE 6 — Recommendation by Hiring Manager 1 (Email-Based)

### Trigger  
```
current_step = "Ready for Recommendation – Hiring Manager 1"
```

### Buttons  
- Recommend  
- Do Not Recommend  
- Request Change  

### On Response  
Save:
```
approvals.hm1 = { decision, comment }
```
Recruiter updates:
- If HM2 exists → `current_step = "Ready for Recommendation – Hiring Manager 2"`
- If none → `current_step = "Ready for Approval – Approver 1"`

---

# 🟦 PHASE 7 — Recommendation by Hiring Manager 2 (Optional, Email-Based)

### Trigger  
```
current_step = "Ready for Recommendation – Hiring Manager 2"
```

### Condition  
Skip automatically if `hiring_manager2_email` is null.

### Buttons  
- Recommend  
- Do Not Recommend  
- Request Change  

### On Response  
Save:
```
approvals.hm2 = { decision, comment }
```
Recruiter updates:
```
current_step = "Ready for Approval – Approver 1"
```

---

# 🟦 PHASE 8 — Approval by Approver 1 (Email-Based)

### Trigger  
```
current_step = "Ready for Approval – Approver 1"
```

### Buttons  
- Approve  
- Reject  
- Request Change  

### On Response  
Save:
```
approvals.approver1 = { decision, comment }
```

Recruiter updates:
- If approver2 exists → `current_step = "Ready for Approval – Approver 2"`
- If not → `current_step = "Ready for Contract Issuance"`

---

# 🟦 PHASE 9 — Approval by Approver 2 (Optional, Email-Based)

### Trigger  
```
current_step = "Ready for Approval – Approver 2"
```

### Buttons  
- Approve  
- Reject  
- Request Change  

### On Response  
Save:
```
approvals.approver2 = { decision, comment }
```

Recruiter updates:
```
current_step = "Ready for Contract Issuance"
```

---

# 🟦 PHASE 10 — Contract Issuance (Manual)

Recruiter prepares and issues contract manually.

Updates:
```
current_step = "Contract Issued"
```

---

# 🟦 PHASE 11 — Hiring Dashboard (Bolt.new)

Dashboard includes:
- List of candidates with progress bars  
- Step-by-step status  
- SLA timers  
- Approval trail  
- Automated comments from approvers  

---

# 🟦 PHASE 12 — Notifications & Reminders

Power Automate reminders:  
- HM1 pending > 48h  
- HM2 pending > 48h  
- Approver 1 pending > 24h  
- Approver 2 pending > 24h  
- Weekly recruiter digest  

Channels: Email, Teams, optional WhatsApp

---

# 🟦 PHASE 13 — End-to-End Workflow Summary

```
Selected for Hiring
→ Assessment Email
→ Assessment Completed
→ Background Check (Manual)
→ Salary Package (GPT)
→ Verification by Head, Talent Strategy (Email)
→ HM1 Recommendation (Email)
→ HM2 Recommendation (Optional Email)
→ Approver 1 (Email)
→ Approver 2 (Optional Email)
→ Contract Issuance (Manual)
→ Hired
```

---

# ✅ End of Specification
