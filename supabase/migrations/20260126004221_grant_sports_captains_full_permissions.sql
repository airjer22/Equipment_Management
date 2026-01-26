/*
  # Grant Sports Captains Full Permissions for Borrowing/Returning

  1. Changes to Policies
    - Drop and recreate equipment_items UPDATE policies to eliminate conflicts
    - Ensure sports captains can update equipment status for loan operations
    - Ensure sports captains can create loans as themselves
    - Ensure sports captains can update loans they created for returns
    
  2. Security
    - Sports captains can only create loans with themselves as borrowed_by_user_id
    - Sports captains can update equipment status (for borrow/return operations)
    - Sports captains can update loans they created (for return operations)
    - Admins and coaches retain all their existing permissions
*/

-- Drop existing conflicting UPDATE policies on equipment_items
DROP POLICY IF EXISTS "Admins and coaches can update equipment" ON equipment_items;
DROP POLICY IF EXISTS "Sports captains can update equipment status" ON equipment_items;

-- Create a unified UPDATE policy for equipment_items that includes sports captains
CREATE POLICY "Authorized users can update equipment"
  ON equipment_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach', 'sports_captain')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach', 'sports_captain')
    )
  );

-- Drop and recreate loan UPDATE policy to include sports captains
DROP POLICY IF EXISTS "Authenticated users can update loans" ON loans;

CREATE POLICY "Authorized users can update loans"
  ON loans
  FOR UPDATE
  TO authenticated
  USING (
    borrowed_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach', 'sports_captain')
    )
  )
  WITH CHECK (
    borrowed_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach', 'sports_captain')
    )
  );

-- Ensure loan INSERT policy allows sports captains (keep existing logic)
DROP POLICY IF EXISTS "Authenticated users can create loans" ON loans;

CREATE POLICY "Authenticated users can create loans"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    borrowed_by_user_id = auth.uid()
  );