/*
  # Remove Student Personal Information from Loans Table

  1. Changes
    - Remove `student_name` column from loans table
    - Remove `student_email` column from loans table  
    - Remove `student_enrollment` column from loans table
    - Keep only `student_id` for matching with localStorage data
  
  2. Rationale
    - Student personal information (name, email, enrollment) will be stored only in localStorage
    - Loans table only stores anonymous student_id reference
    - App matches student_id to localStorage to display student details
    - Zero student PII stored in online database
  
  3. Impact
    - Existing loan records will lose student name/email/enrollment data
    - Student identification will rely on localStorage matching
    - Single-device usage model ensures data availability
*/

-- Remove student personal information columns from loans table
DO $$
BEGIN
  -- Drop student_name column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'student_name'
  ) THEN
    ALTER TABLE loans DROP COLUMN student_name;
  END IF;

  -- Drop student_email column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'student_email'
  ) THEN
    ALTER TABLE loans DROP COLUMN student_email;
  END IF;

  -- Drop student_enrollment column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'student_enrollment'
  ) THEN
    ALTER TABLE loans DROP COLUMN student_enrollment;
  END IF;
END $$;
