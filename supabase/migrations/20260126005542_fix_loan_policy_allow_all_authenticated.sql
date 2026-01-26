/*
  # Fix Loan Policy - Allow All Authenticated Users

  1. Changes to Policies
    - Temporarily allow all authenticated users to create loans
    - This will help us debug the actual issue
    
  2. Security
    - This is a temporary fix for debugging
    - Will be tightened once we identify the root cause
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create loans" ON loans;

-- Create a simple policy that allows all authenticated users
CREATE POLICY "Authenticated users can create loans"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);