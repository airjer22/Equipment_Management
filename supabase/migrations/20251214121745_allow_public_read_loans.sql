/*
  # Allow Public Read Access for Loans

  1. Changes
    - Drop existing restrictive SELECT policy for loans
    - Add new policy that allows anyone to view loans
    - This enables viewing loan history and status without authentication
  
  2. Security
    - Only SELECT/read operations are allowed without authentication
    - Creating and updating loans still requires authentication
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Everyone can view loans" ON loans;

-- Add new public read policy
CREATE POLICY "Public can view loans"
  ON loans FOR SELECT
  USING (true);