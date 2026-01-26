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
    - Warning system:
      - First offense: First Warning
      - Second offense: Second Warning
      - Third offense: Final Warning
      - Fourth offense: Suspension eligibility
      - After any suspension: Each late return triggers immediate suspension eligibility
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
  late_returns_since_suspension integer;
  threshold integer;
BEGIN
  suspension_count := count_student_suspensions(student_uuid);
  late_returns_since_suspension := get_late_returns_since_last_suspension(student_uuid);

  -- If student has been suspended before, any late return triggers suspension eligibility
  IF suspension_count > 0 THEN
    RETURN 1;
  END IF;

  -- For students never suspended: progressive warnings
  -- 1st offense = First Warning (threshold 1)
  -- 2nd offense = Second Warning (threshold 2)
  -- 3rd offense = Final Warning (threshold 3)
  -- 4th offense = Suspension eligibility (threshold 4)
  -- Calculate next threshold based on current late returns
  IF late_returns_since_suspension < 4 THEN
    threshold := late_returns_since_suspension + 1;
  ELSE
    threshold := 4;
  END IF;

  RETURN threshold;
END;
$$ LANGUAGE plpgsql;
