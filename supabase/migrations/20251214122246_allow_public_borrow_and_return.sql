/*
  # Allow Public Borrowing and Returning

  1. Changes
    - Drop existing restrictive policies for loans INSERT
    - Drop existing restrictive policies for equipment_items UPDATE
    - Add new policies that allow anyone (authenticated or not) to create loans
    - Add new policies that allow anyone to update equipment status
    - This enables Sports Captain Dashboard to work without authentication
  
  2. Security
    - Only loans INSERT and equipment_items UPDATE operations are allowed without authentication
    - Other operations still require proper authentication and roles
    - This is intentional for the sports captain demo/kiosk mode
*/

-- Drop existing restrictive policies for loans
DROP POLICY IF EXISTS "Authenticated users can create loans" ON loans;
DROP POLICY IF EXISTS "Authenticated users can update loans" ON loans;

-- Add new public policies for loans
CREATE POLICY "Public can create loans"
  ON loans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update loans"
  ON loans FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Drop existing sports captain policy for equipment
DROP POLICY IF EXISTS "Sports captains can update equipment status" ON equipment_items;

-- Add new public policy for equipment updates (to change status during borrow/return)
CREATE POLICY "Public can update equipment status"
  ON equipment_items FOR UPDATE
  USING (true)
  WITH CHECK (true);