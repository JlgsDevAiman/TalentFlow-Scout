# Seeding Job Descriptions

To enable the AI Position Recommendation feature, you need to add job descriptions to your database.

## Option 1: Manual Upload (Recommended)

As an admin user:

1. Log in to your TalentFlow Scout application
2. Navigate to the Admin Dashboard
3. Go to "Job Descriptions" section (you'll need to add this UI)
4. Upload your job description files from `public/job-descriptions/` folder

## Option 2: Using Supabase SQL Editor

Run the following SQL in your Supabase SQL Editor to add sample job descriptions:

```sql
-- Insert Architecture Specialist position
INSERT INTO job_descriptions (title, description, department, is_active, created_by)
VALUES (
  'Architecture Specialist',
  'We are seeking an experienced Architecture Specialist with expertise in cloud computing, infrastructure management, and enterprise architecture. The ideal candidate will have over 10 years of experience in designing and implementing scalable, secure, and efficient IT architectures.',
  'IT',
  true,
  (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com' LIMIT 1)
);

-- Insert DGM, Digital position
INSERT INTO job_descriptions (title, description, department, is_active, created_by)
VALUES (
  'DGM, Digital',
  'Deputy General Manager, Digital - Leading digital transformation initiatives, managing digital products and services, and driving innovation across the organization. Requires strong leadership skills and experience in digital strategy.',
  'Digital',
  true,
  (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com' LIMIT 1)
);

-- Insert Director, Growth & Supply Chain position
INSERT INTO job_descriptions (title, description, department, is_active, created_by)
VALUES (
  'Director, Growth & Supply Chain',
  'Senior leadership role responsible for driving business growth and optimizing supply chain operations. The ideal candidate will have extensive experience in strategic planning, operations management, and cross-functional leadership.',
  'Operations',
  true,
  (SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com' LIMIT 1)
);
```

**Note:** Replace `your-admin-email@example.com` with your actual admin email address.

## How It Works

Once job descriptions are added:

1. When you click "Get AI Score" for a candidate, the system will:
   - Analyze the candidate's profile against ALL job descriptions in the library
   - Identify the best matching position
   - Provide fit scores for each position
   - Display the recommended position if it differs from the position they applied for

2. The candidate card will show:
   - AI Fit Score (for the best matching position)
   - Recommended Position (if different from applied position)
   - Overall assessment comment

## Adding Full Job Description Content

For better matching accuracy, extract the full text from your .docx files and add them to the `description` field. You can use tools like:
- Microsoft Word (copy/paste)
- Online DOCX to text converters
- Document parsing libraries

The more detailed the job description, the better the AI matching will be!
