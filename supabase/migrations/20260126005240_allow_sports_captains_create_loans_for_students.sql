/*
  # Allow Sports Captains to Create Loans for Students - Simplified

  1. Changes to Policies
    - Drop all existing INSERT policies on loans
    - Create one simple policy that allows:
      - Users to create loans for themselves, OR
      - Admins/coaches/sports captains to create loans for anyone
    
  2. Security
    - Regular users can only borrow for themselves
    - Privileged users can create loans for any student
*/

-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Privileged users can create any loan" ON loans;
DROP POLICY IF EXISTS "Regular users can create loans for themselves" ON loans;
DROP POLICY IF EXISTS "Authorized users can create loans for students" ON loans;
DROP POLICY IF EXISTS "Authenticated users can create loans" ON loans;

-- Create a single, simple INSERT policy
CREATE POLICY "Users can create loans"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Either: user is creating a loan for themselves
    borrowed_by_user_id = auth.uid()
    OR
    -- Or: user is admin, coach, or sports captain (can create for anyone)
    (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin', 'coach', 'sports_captain')
  );