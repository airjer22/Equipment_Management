/*
  # Restore Public Read Access for Equipment and Students

  1. Changes
    - Update equipment SELECT policy to allow public access (not just authenticated)
    - Update students SELECT policy to allow public access
    
  2. Reason
    - The sports captain dashboard needs to be able to view equipment and students
    - These are considered public information in this school context
    - Write operations still require proper authentication and roles
*/

-- Update equipment view policy to allow public access
DROP POLICY IF EXISTS "Everyone can view equipment" ON equipment_items;
CREATE POLICY "Public can view equipment"
  ON equipment_items FOR SELECT
  USING (true);

-- Update students view policy to allow public access  
DROP POLICY IF EXISTS "Public can view students" ON students;
CREATE POLICY "Public can view students"
  ON students FOR SELECT
  USING (true);

-- Update loans view policy to allow public access
DROP POLICY IF EXISTS "Public can view loans" ON loans;
CREATE POLICY "Public can view loans"
  ON loans FOR SELECT
  USING (true);
