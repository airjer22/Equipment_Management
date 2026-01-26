/*
  # Update Warning Threshold to One Offense Per Level

  1. Changes
    - Update get_warning_threshold function to use one offense per warning level
    - First offense: First Warning (threshold 1)
    - Second offense: Second Warning (threshold 2)
    - Third offense: Final Warning (threshold 3)
    - Fourth offense: Suspension eligibility (threshold 4)
    - After any suspension: Each late return triggers immediate suspension (threshold 1)

  2. Security
    - No RLS changes needed
*/

-- Update the warning threshold function
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
