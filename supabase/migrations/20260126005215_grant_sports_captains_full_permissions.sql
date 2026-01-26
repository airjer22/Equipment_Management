/*
  # Grant Sports Captains Full Permissions on Loans

  1. Changes to Policies
    - Drop the complex conditional INSERT policy
    - Create separate policies for regular users and privileged users (admins, coaches, sports captains)
    - Privileged users can create loans for any student without restrictions
    
  2. Security
    - Regular authenticated users can only create loans for themselves
    - Admins, coaches, and sports captains have full access to create loans for anyone
    - This is necessary for the borrow/return workflow where captains create loans on behalf of students
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authorized users can create loans for students" ON loans;

-- Create policy for privileged users (admins, coaches, sports captains)
CREATE POLICY "Privileged users can create any loan"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach', 'sports_captain')
    )
  );

-- Create policy for regular users (can only create loans for themselves)
CREATE POLICY "Regular users can create loans for themselves"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    borrowed_by_user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach', 'sports_captain')
    )
  );