/*
  # Create User Profiles and Roles System

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `role` (text, not null, default 'user')
      - `full_name` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `profiles` table
    - Add policy for users to read their own profile
    - Add policy for admins to read all profiles
    - Add policy for admins to update user roles
    - Add policy for users to update their own profile (except role)
  
  3. Functions
    - Create trigger function to auto-create profile on user signup
    - Function to check if user is admin
  
  4. Admin Users
    - Automatically set admin role for specified email addresses:
      - syafrina.kamaruzaman@jlandgroup.com.my
      - ernisyafrina@gmail.com
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text := 'user';
BEGIN
  -- Check if email is an admin email
  IF NEW.email IN ('syafrina.kamaruzaman@jlandgroup.com.my', 'ernisyafrina@gmail.com') THEN
    user_role := 'admin';
  END IF;

  -- Insert profile
  INSERT INTO profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- RLS Policies

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create profiles for existing users
DO $$
DECLARE
  user_record RECORD;
  user_role text;
BEGIN
  FOR user_record IN SELECT id, email FROM auth.users LOOP
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_record.id) THEN
      -- Determine role
      IF user_record.email IN ('syafrina.kamaruzaman@jlandgroup.com.my', 'ernisyafrina@gmail.com') THEN
        user_role := 'admin';
      ELSE
        user_role := 'user';
      END IF;
      
      -- Insert profile
      INSERT INTO profiles (id, email, role)
      VALUES (user_record.id, user_record.email, user_role)
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Update RLS policies for candidates table to allow admin access
DROP POLICY IF EXISTS "Admins can read all candidates" ON candidates;
CREATE POLICY "Admins can read all candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert candidates" ON candidates;
CREATE POLICY "Admins can insert candidates"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all candidates" ON candidates;
CREATE POLICY "Admins can update all candidates"
  ON candidates FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete all candidates" ON candidates;
CREATE POLICY "Admins can delete all candidates"
  ON candidates FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));