/*
  # Add student information fields to loans table
  
  Since student data is now stored in localStorage for privacy, we need to store
  student information directly in the loans table for display purposes.
  
  ## Changes
  
  1. **Add Student Information Columns**
     - `student_name` (text) - Student's full name
     - `student_email` (text) - Student's email address
     - `student_enrollment_number` (text) - Student enrollment/ID number
  
  2. **Keep existing student_id column**
     - Used as a reference key to link with localStorage data
  
  ## Notes
  
  - These fields will be populated when creating new loans
  - Existing loans without this data will show as "Unknown Student"
*/

-- Add student information columns to loans table
ALTER TABLE loans 
  ADD COLUMN IF NOT EXISTS student_name text,
  ADD COLUMN IF NOT EXISTS student_email text,
  ADD COLUMN IF NOT EXISTS student_enrollment_number text;