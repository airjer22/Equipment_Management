/*
  # Add Escalating Warning System for Late Returns

  1. Changes
    - Add function to check and auto-unblacklist students whose suspension period has ended
    - Add helper function to count suspensions for a student
    - Add helper function to get late returns since last suspension
    
  2. Security
    - No RLS changes needed - using existing permissions
  
  3. Notes
    - Total late returns are NEVER reset - always tracked in full history
    - Only the warning threshold escalates based on suspension history
    - First warning: 3 late returns
    - Second warning: 2 more late returns (5 total)
    - Subsequent warnings: after each additional late return
*/

-- Function to automatically unblacklist students when their suspension ends
CREATE OR REPLACE FUNCTION auto_unblacklist_expired_suspensions()
RETURNS void AS $$
BEGIN
  -- Update students whose blacklist period has expired
  UPDATE students
  SET 
    is_blacklisted = false,
    blacklist_end_date = NULL,
    updated_at = now()
  WHERE 
    is_blacklisted = true
    AND blacklist_end_date IS NOT NULL
    AND blacklist_end_date < now();

  -- Mark blacklist entries as inactive when they expire
  UPDATE blacklist_entries
  SET is_active = false
  WHERE 
    is_active = true
    AND end_date < now();
END;
$$ LANGUAGE plpgsql;

-- Function to count how many times a student has been suspended
CREATE OR REPLACE FUNCTION count_student_suspensions(student_uuid uuid)
RETURNS integer AS $$
DECLARE
  suspension_count integer;
BEGIN
  SELECT COUNT(*)
  INTO suspension_count
  FROM blacklist_entries
  WHERE student_id = student_uuid;
  
  RETURN COALESCE(suspension_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get late returns since last suspension (or all time if never suspended)
CREATE OR REPLACE FUNCTION get_late_returns_since_last_suspension(student_uuid uuid)
RETURNS integer AS $$
DECLARE
  last_suspension_end timestamptz;
  late_count integer;
BEGIN
  -- Find the most recent suspension end date
  SELECT end_date
  INTO last_suspension_end
  FROM blacklist_entries
  WHERE student_id = student_uuid
  ORDER BY end_date DESC
  LIMIT 1;
  
  -- If never suspended, count all late returns
  -- If suspended before, count late returns after the last suspension ended
  IF last_suspension_end IS NULL THEN
    SELECT COUNT(*)
    INTO late_count
    FROM loans
    WHERE student_id = student_uuid
    AND returned_at IS NOT NULL
    AND returned_at > due_at;
  ELSE
    SELECT COUNT(*)
    INTO late_count
    FROM loans
    WHERE student_id = student_uuid
    AND returned_at IS NOT NULL
    AND returned_at > due_at
    AND returned_at > last_suspension_end;
  END IF;
  
  RETURN COALESCE(late_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get the warning threshold for a student based on suspension history
CREATE OR REPLACE FUNCTION get_warning_threshold(student_uuid uuid)
RETURNS integer AS $$
DECLARE
  suspension_count integer;
  threshold integer;
BEGIN
  suspension_count := count_student_suspensions(student_uuid);
  
  -- First warning: 3 late returns
  -- Second warning: 5 late returns (3 + 2)
  -- Third+ warnings: 6, 7, 8, etc. (increment by 1 each time)
  IF suspension_count = 0 THEN
    threshold := 3;
  ELSIF suspension_count = 1 THEN
    threshold := 5;
  ELSE
    -- After 2 suspensions, threshold is 6, 7, 8, etc.
    threshold := 5 + suspension_count - 1;
  END IF;
  
  RETURN threshold;
END;
$$ LANGUAGE plpgsql;
