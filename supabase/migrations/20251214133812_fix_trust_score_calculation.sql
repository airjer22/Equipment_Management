/*
  # Fix Trust Score Calculation

  ## Changes
  The trust score calculation now factors in active overdue loans, not just completed returns.
  
  ## Updated Logic
  - **Completed loans**: On-time returns add positive points
  - **Active overdue loans**: Each overdue loan deducts 15 points from the base score
  - **Base score**: Starts at 100
  - **Minimum score**: Cannot go below 0
  
  ## Examples
  - 3 borrowed, 0 returned, 3 overdue = 100 - (3 × 15) = 55%
  - 3 borrowed, 3 returned late, 0 active = (0/3) × 100 = 0%
  - 5 borrowed, 4 on-time, 1 late returned, 0 active = (4/5) × 100 = 80%
  - 10 borrowed, 8 on-time, 2 overdue active = (8/10) × 100 - (2 × 15) = 50%
*/

-- Drop existing function and create improved version
CREATE OR REPLACE FUNCTION calculate_trust_score(student_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_completed integer;
  on_time_returns integer;
  active_overdue integer;
  score numeric;
BEGIN
  -- Count total completed loans (returned items)
  SELECT COUNT(*)
  INTO total_completed
  FROM loans
  WHERE student_id = student_uuid
  AND returned_at IS NOT NULL;
  
  -- Count active overdue loans (not returned and past due date)
  SELECT COUNT(*)
  INTO active_overdue
  FROM loans
  WHERE student_id = student_uuid
  AND returned_at IS NULL
  AND due_at < now();
  
  -- If no loan history at all, return default score
  IF total_completed = 0 AND active_overdue = 0 THEN
    RETURN 50.0;
  END IF;
  
  -- Start with base score
  score := 100.0;
  
  -- If there are completed loans, calculate on-time percentage
  IF total_completed > 0 THEN
    -- Count on-time returns
    SELECT COUNT(*)
    INTO on_time_returns
    FROM loans
    WHERE student_id = student_uuid
    AND returned_at IS NOT NULL
    AND returned_at <= due_at;
    
    -- Calculate percentage based on completed loans
    score := (on_time_returns::numeric / total_completed::numeric) * 100;
  END IF;
  
  -- Deduct points for active overdue loans (15 points per overdue item)
  score := score - (active_overdue * 15);
  
  -- Ensure score doesn't go below 0
  IF score < 0 THEN
    score := 0;
  END IF;
  
  RETURN ROUND(score, 1);
END;
$$ LANGUAGE plpgsql;

-- Update trigger to also recalculate on new borrows and overdue changes
CREATE OR REPLACE FUNCTION update_student_trust_score()
RETURNS trigger AS $$
BEGIN
  -- Update trust score when:
  -- 1. A loan is returned
  -- 2. A loan becomes overdue
  -- 3. A new loan is created
  
  IF (NEW.returned_at IS NOT NULL AND (OLD IS NULL OR OLD.returned_at IS NULL OR OLD.returned_at IS DISTINCT FROM NEW.returned_at))
     OR (NEW.is_overdue = true AND (OLD IS NULL OR OLD.is_overdue = false))
     OR (TG_OP = 'INSERT') THEN
    
    UPDATE students
    SET trust_score = calculate_trust_score(NEW.student_id),
        updated_at = now()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trust_score_trigger ON loans;
CREATE TRIGGER trust_score_trigger
  AFTER INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_student_trust_score();

-- Recalculate all existing trust scores
UPDATE students
SET trust_score = calculate_trust_score(id),
    updated_at = now();