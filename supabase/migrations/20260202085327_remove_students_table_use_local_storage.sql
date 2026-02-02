/*
  # Move student data to local storage for privacy
  
  This migration removes student personally identifiable information from the database
  to comply with student privacy policies. Student data will be stored locally on the
  device instead of on a remote server.

  ## Changes

  1. **Drop Foreign Key Constraints**
     - Remove foreign key constraints from loans table referencing students
     - Remove foreign key constraints from reservations table referencing students
     - Remove foreign key constraints from blacklist_entries table referencing students

  2. **Alter Tables to Use Text References**
     - Change student_id in loans table from uuid to text
     - Change student_id in reservations table from uuid to text
     - Change student_id in blacklist_entries table from uuid to text

  3. **Drop Students Table**
     - Remove the students table entirely
     - All student data will be managed locally via browser localStorage

  4. **Remove Student-Related Functions**
     - Drop calculate_trust_score function
     - Drop update_student_trust_score function and trigger

  ## Security Notes
  
  - Student PII is no longer stored on remote servers
  - Loan records only contain a text reference to local student IDs
  - Equipment and user data remain in Supabase for inventory management
*/

-- Drop triggers and functions that reference students table
DROP TRIGGER IF EXISTS trust_score_trigger ON loans;
DROP FUNCTION IF EXISTS update_student_trust_score();
DROP FUNCTION IF EXISTS calculate_trust_score(uuid);

-- Drop foreign key constraints and change column types

-- Loans table
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_student_id_fkey;
ALTER TABLE loans ALTER COLUMN student_id TYPE text USING student_id::text;

-- Reservations table
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_student_id_fkey;
ALTER TABLE reservations ALTER COLUMN student_id TYPE text USING student_id::text;

-- Blacklist entries table
ALTER TABLE blacklist_entries DROP CONSTRAINT IF EXISTS blacklist_entries_student_id_fkey;
ALTER TABLE blacklist_entries ALTER COLUMN student_id TYPE text USING student_id::text;

-- Drop students table
DROP TABLE IF EXISTS students CASCADE;
