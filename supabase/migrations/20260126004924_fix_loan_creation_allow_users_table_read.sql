/*
  # Fix Loan Creation by Allowing Users Table Read Access

  1. Changes to Policies
    - Update users table SELECT policy to allow all authenticated users to read user profiles
    - This is needed so that RLS policies on other tables can check user roles
    
  2. Security
    - Users table only contains non-sensitive profile information (id, email, name, role)
    - Allowing read access is safe and necessary for role-based access control
    - Users can still only update their own profiles
*/

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create a more permissive SELECT policy that allows all authenticated users to read profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);