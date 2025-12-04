/*
  # Create Unified Approval Tokens System

  1. New Tables
    - `approval_tokens_unified`
      - `id` (uuid, primary key)
      - `candidate_id` (uuid, foreign key to candidate_hiring_flow)
      - `token` (text, unique) - Secure random token for URL
      - `approval_type` (text) - Type: 'hm1', 'hm2', 'approver1', 'approver2'
      - `approver_email` (text) - Email of the person who needs to approve
      - `expires_at` (timestamptz) - Token expiration (7 days from creation)
      - `used` (boolean) - Whether token has been used
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `approval_tokens_unified` table
    - Allow anonymous users to read valid tokens for approval
    - Authenticated users can manage tokens
    
  3. Indexes
    - Index on token for fast lookup
    - Index on candidate_id for tracking
    - Index on approval_type for filtering
*/

CREATE TABLE IF NOT EXISTS approval_tokens_unified (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidate_hiring_flow(candidate_id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  approval_type text NOT NULL CHECK (approval_type IN ('hm1', 'hm2', 'approver1', 'approver2')),
  approver_email text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_tokens_unified_token ON approval_tokens_unified(token);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_unified_candidate ON approval_tokens_unified(candidate_id);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_unified_type ON approval_tokens_unified(approval_type);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_unified_expires ON approval_tokens_unified(expires_at);

ALTER TABLE approval_tokens_unified ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous can read valid tokens"
  ON approval_tokens_unified
  FOR SELECT
  TO anon
  USING (
    NOT used 
    AND expires_at > now()
  );

CREATE POLICY "Authenticated users can manage tokens"
  ON approval_tokens_unified
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
