/*
  # Fix late return counter function column name

  1. Changes
    - Update the `update_late_return_counters()` function to use the correct column name
    - Change `late_returns_since_suspension` to `late_returns_since_last_suspension`
    
  2. Details
    - This fixes a bug where the trigger was referencing a non-existent column
    - Allows loans to be properly updated when returned
*/

CREATE OR REPLACE FUNCTION update_late_return_counters()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  late_count integer;
  late_since_suspension integer;
BEGIN
  IF NEW.returned_at IS NOT NULL AND NEW.returned_at > NEW.due_at THEN
    SELECT COUNT(*) INTO late_count 
    FROM loans 
    WHERE student_id = NEW.student_id 
      AND returned_at IS NOT NULL 
      AND returned_at > due_at;
    
    late_since_suspension := get_late_returns_since_last_suspension(NEW.student_id);
    
    UPDATE students 
    SET total_late_returns = late_count, 
        late_returns_since_last_suspension = late_since_suspension 
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$;
