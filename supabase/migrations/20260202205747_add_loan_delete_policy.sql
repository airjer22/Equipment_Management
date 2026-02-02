/*
  # Add DELETE policy for loans table

  1. Changes
    - Add policy to allow authenticated users to delete loans
    - This enables the analytics reset functionality to work properly

  2. Security
    - Only authenticated users can delete loans
    - This allows admins and sports captains to reset loan data
*/

CREATE POLICY "Authenticated users can delete loans"
  ON loans
  FOR DELETE
  TO authenticated
  USING (true);
