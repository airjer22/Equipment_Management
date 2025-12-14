/*
  # Allow Public Read Access for Equipment and Students

  1. Changes
    - Drop existing restrictive SELECT policies for equipment and students
    - Add new policies that allow anyone (authenticated or not) to view equipment and students
    - This enables the Sports Captain Dashboard demo mode to work without login
  
  2. Security
    - Only SELECT/read operations are allowed without authentication
    - INSERT, UPDATE, DELETE still require authentication and proper roles
    - Students and equipment data is considered public information in this school context
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Everyone can view equipment" ON equipment_items;
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;

-- Add new public read policies for equipment
CREATE POLICY "Public can view equipment"
  ON equipment_items FOR SELECT
  USING (true);

-- Add new public read policies for students
CREATE POLICY "Public can view students"
  ON students FOR SELECT
  USING (true);