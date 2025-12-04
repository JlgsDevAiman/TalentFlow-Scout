/*
  # Update Approvers User ID Foreign Key

  1. Changes
    - Drop existing foreign key constraint on approvers.user_id -> auth.users
    - Add new foreign key constraint on approvers.user_id -> profiles.id
    
  2. Notes
    - Since profiles.id references auth.users.id, this maintains referential integrity
    - Aligns with the application's user management pattern
    - Ensures approvers are linked to user profiles in the profiles table
*/

-- Drop the existing foreign key constraint
ALTER TABLE approvers 
  DROP CONSTRAINT IF EXISTS approvers_user_id_fkey;

-- Add new foreign key constraint to profiles table
ALTER TABLE approvers
  ADD CONSTRAINT approvers_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;