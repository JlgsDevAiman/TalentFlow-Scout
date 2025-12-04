# TalentFlow Scout -- Build Phases Guide (For Bolt.new)

This guide includes all 5 phases required to build the TalentFlow Scout
app in Bolt.new.\
The app includes: **Sign In/Sign Up, Database, CRUD, AI Integration, and
Edge Functions.**

------------------------------------------------------------------------

## Phase 0 -- Setup

Before building, prepare these tools:

1.  **Bolt.new** -- for building the app UI and logic
2.  **Supabase** -- for database + authentication + edge functions
3.  **OpenAI API Key** -- for AI scoring & job fit suggestions

------------------------------------------------------------------------

## Phase 1 -- Sign In / Sign Up (Authentication)

### What this phase does:

-   Allows HR users to create accounts and log in securely
-   Protects the candidate database from outsiders

### Steps:

1.  In Bolt.new, connect your Supabase URL + Anon Key\
2.  Create a **Login Page** with:
    -   Email input\
    -   Password input\
    -   Buttons: **Sign Up** and **Sign In**
3.  Make these actions:
    -   **Sign Up:** call Supabase `signUp(email, password)`
    -   **Sign In:** call Supabase `signInWithPassword(email, password)`
4.  After login success, navigate user to **Dashboard Home**

------------------------------------------------------------------------

## Phase 2 -- Database (Supabase Table)

### Table name: `candidates`

Recommended fields: - `id` (auto) - `full_name` - `email` - `phone` -
`position_applied` - `years_experience` - `status` (New, Shortlisted,
Rejected, Hired) - `notes` - `ai_fit_score` - `ai_fit_comment` -
`created_at` (timestamp)

### Steps:

1.  Go to Supabase → Table Editor\
2.  Create table **`candidates`**\
3.  Add all fields\
4.  Turn on Row Level Security\
5.  Allow read/write for authenticated users only

------------------------------------------------------------------------

## Phase 3 -- CRUD (Create, Read, Update, Delete)

### What this phase does:

-   Lets HR manage all candidate data

### 3.1 READ (List & View)

1.  Create dashboard page after login\

2.  On load, fetch from Supabase:

        select * from candidates order by created_at desc

3.  Display in table format:

    -   Name \| Position \| Status \| Actions

### 3.2 CREATE (Add Candidate)

1.  Add button **"Add Candidate"**\
2.  Show form with inputs: Name, Email, Phone, Position, Experience\
3.  On Save → insert into Supabase\
4.  Refresh candidate list

### 3.3 UPDATE (Edit Candidate)

1.  Add **Edit** button per row\
2.  Show form with editable values\
3.  On Save → update Supabase entry

### 3.4 DELETE (Remove Candidate)

1.  Add **Delete** button\
2.  Confirm action\
3.  Delete from Supabase using ID

------------------------------------------------------------------------

## Phase 4 -- AI Integration (OpenAI API)

### What this phase does:

Uses OpenAI to: - Score candidates (0--100) - Give job-fit comments

### Steps:

1.  On candidate detail page, add button **"Ask AI: Fit Score"**

2.  Send candidate info to OpenAI: Example prompt:

        You are an HR assistant. 
        Candidate:
        Name: …
        Position: …
        Experience: …
        Notes: …

        Give a fit score (0–100) and 1–2 sentence comment.

3.  Receive AI response\

4.  Save results to:

    -   `ai_fit_score`
    -   `ai_fit_comment`

5.  Display results neatly on screen

------------------------------------------------------------------------

## Phase 5 -- Edge Function (External Auto‑Insert)

### What this phase does:

Allows other apps (forms, game, website) to send data directly into
Supabase.

### Steps:

1.  In Supabase → Create **Edge Function**

2.  Function receives POST JSON:

    ``` json
    {
      "full_name": "Aisyah",
      "email": "aisyah@example.com",
      "phone": "0123456789",
      "position_applied": "Analyst",
      "years_experience": 1
    }
    ```

3.  Insert into database using service role key\

4.  Return success JSON\

5.  External apps can now call this function URL

------------------------------------------------------------------------

## End of File

You may now copy‑paste these phases into Bolt.new to begin building
TalentFlow Scout step by step.
