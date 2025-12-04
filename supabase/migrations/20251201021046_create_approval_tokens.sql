/*
  # Create Approval Tokens System

  1. New Tables
    - `approval_tokens`
      - `id` (uuid, primary key)
      - `approval_history_id` (uuid, foreign key to approval_history)
      - `token` (text, unique) - Secure random token for URL
      - `expires_at` (timestamptz) - Token expiration (7 days from creation)
      - `used` (boolean) - Whether token has been used
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `approval_tokens` table
    - Add policy for service role to manage tokens
    - Tokens expire after 7 days
    - Tokens can only be used once
    
  3. Indexes
    - Index on token for fast lookup
    - Index on approval_history_id for tracking
*/

CREATE TABLE IF NOT EXISTS approval_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_history_id uuid NOT NULL REFERENCES approval_history(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_approval_tokens_token ON approval_tokens(token);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_history ON approval_tokens(approval_history_id);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_expires ON approval_tokens(expires_at);

-- Enable RLS
ALTER TABLE approval_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage approval tokens"
  ON approval_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anonymous users to read non-expired, unused tokens (for validation)
CREATE POLICY "Anonymous can read valid tokens"
  ON approval_tokens
  FOR SELECT
  TO anon
  USING (
    NOT used 
    AND expires_at > now()
  );
