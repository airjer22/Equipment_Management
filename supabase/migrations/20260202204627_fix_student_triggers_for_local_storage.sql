/*
  # Remove Database-Level Student Tracking Triggers
  
  1. Changes
    - Drop `update_late_return_counters()` function and trigger
    - Drop `get_late_returns_since_last_suspension()` function
    - Student tracking (late returns, trust scores) is now handled in localStorage
  
  2. Rationale
    - Students are now stored in localStorage, not in the database
    - student_id is now text (localStorage key) instead of uuid
    - Database triggers expecting uuid cause errors
    - Frontend handles all student tracking via localStorage
  
  3. Impact
    - Removes type mismatch errors when updating loans
    - Student tracking continues via localStorage (no functionality lost)
    - Cleaner separation: database stores loans, localStorage tracks students
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS late_return_counter_trigger ON loans;

-- Drop the function that the trigger calls
DROP FUNCTION IF EXISTS update_late_return_counters() CASCADE;

-- Drop the helper function
DROP FUNCTION IF EXISTS get_late_returns_since_last_suspension(uuid) CASCADE;
