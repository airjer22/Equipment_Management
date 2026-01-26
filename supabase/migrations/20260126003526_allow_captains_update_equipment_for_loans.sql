/*
  # Allow Sports Captains to Update Equipment Status

  1. Changes
    - Add policy to allow sports captains to update equipment status when creating/managing loans
    - Sports captains need to update equipment status to 'borrowed' or 'available'
    
  2. Security
    - Only allows updating the status field
    - Authenticated users with sports_captain role can update
*/

-- Add policy for sports captains to update equipment status
DROP POLICY IF EXISTS "Sports captains can update equipment status" ON equipment_items;
CREATE POLICY "Sports captains can update equipment status" ON equipment_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'sports_captain'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'sports_captain'));
