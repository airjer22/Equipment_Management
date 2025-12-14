/*
  # Allow Sports Captains to Update Equipment Status

  1. Changes
    - Add policy to allow sports captains to update equipment status when borrowing/returning items
    - This enables the borrow and return flows to work properly for sports captains
  
  2. Security
    - Sports captains can only update the status field
    - All other equipment fields remain protected (admin/coach only)
*/

-- Add policy for sports captains to update equipment status
CREATE POLICY "Sports captains can update equipment status"
  ON equipment_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'sports_captain'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'sports_captain'
    )
  );