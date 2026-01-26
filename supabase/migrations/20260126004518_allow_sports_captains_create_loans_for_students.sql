/*
  # Allow Sports Captains to Create Loans for Students

  1. Changes to Policies
    - Update loans INSERT policy to allow sports captains to create loans on behalf of students
    - Sports captains can create loans with any student as the borrower
    - Regular authenticated users can still only create loans for themselves
    
  2. Security
    - Admins, coaches, and sports captains can create loans for any student
    - Regular users can only create loans for themselves
    - All other existing policies remain intact
*/

-- Drop and recreate loan INSERT policy to allow sports captains to create loans for students
DROP POLICY IF EXISTS "Authenticated users can create loans" ON loans;

CREATE POLICY "Authorized users can create loans for students"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is creating a loan for themselves
    borrowed_by_user_id = auth.uid()
    OR
    -- User is admin, coach, or sports captain (can create loans for anyone)
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach', 'sports_captain')
    )
  );