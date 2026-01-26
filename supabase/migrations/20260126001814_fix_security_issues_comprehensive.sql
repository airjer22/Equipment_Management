/*
  # Fix Security Issues - Indexes, RLS Policies, and Function Security

  1. Performance Improvements
    - Add indexes for all foreign keys to improve query performance
    - Remove unused index on dismissed_notifications
    
  2. RLS Policy Optimization
    - Update all RLS policies to use (select auth.uid()) pattern to avoid re-evaluation per row
    - Fix overly permissive policies that bypass RLS
    - Consolidate multiple permissive policies
    
  3. Function Security
    - Add SECURITY DEFINER and set search_path for all functions
    
  4. Notes
    - Auth DB Connection Strategy and Leaked Password Protection must be configured in Supabase dashboard
*/

-- ============================================================================
-- PART 1: Add Indexes for Foreign Keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_entries_blacklisted_by ON blacklist_entries(blacklisted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_entries_student_id ON blacklist_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_notifications_dismissed_by ON dismissed_notifications(dismissed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_loans_borrowed_by ON loans(borrowed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_loans_equipment_id ON loans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_loans_student_id ON loans(student_id);
CREATE INDEX IF NOT EXISTS idx_reservations_equipment_id ON reservations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_by ON reservations(reserved_by_user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_student_id ON reservations(student_id);

DROP INDEX IF EXISTS idx_dismissed_notifications_student_id;

-- ============================================================================
-- PART 2: Update RLS Policies with Optimized auth.uid() Pattern
-- ============================================================================

-- Users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated
  USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

-- Students table
DROP POLICY IF EXISTS "Admins and coaches can insert students" ON students;
CREATE POLICY "Admins and coaches can insert students" ON students FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));

DROP POLICY IF EXISTS "Admins and coaches can update students" ON students;
CREATE POLICY "Admins and coaches can update students" ON students FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));

DROP POLICY IF EXISTS "Admins can delete students" ON students;
CREATE POLICY "Admins can delete students" ON students FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin'));

-- Equipment items
DROP POLICY IF EXISTS "Admins and coaches can manage equipment" ON equipment_items;
DROP POLICY IF EXISTS "Public can view equipment" ON equipment_items;
DROP POLICY IF EXISTS "Public can update equipment status" ON equipment_items;

CREATE POLICY "Everyone can view equipment" ON equipment_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and coaches can add equipment" ON equipment_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));
CREATE POLICY "Admins and coaches can update equipment" ON equipment_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));
CREATE POLICY "Admins can delete equipment" ON equipment_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin'));

-- Blacklist entries
DROP POLICY IF EXISTS "Admins and coaches can manage blacklist" ON blacklist_entries;
CREATE POLICY "Admins and coaches can view blacklist" ON blacklist_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));
CREATE POLICY "Admins and coaches can add blacklist" ON blacklist_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));
CREATE POLICY "Admins and coaches can update blacklist" ON blacklist_entries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));

-- Settings
DROP POLICY IF EXISTS "Admins can update settings" ON settings;
CREATE POLICY "Admins can update settings" ON settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin'));

-- Activity logs
DROP POLICY IF EXISTS "Admins can view all logs" ON activity_logs;
CREATE POLICY "Admins can view all logs" ON activity_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin'));

DROP POLICY IF EXISTS "Everyone can create logs" ON activity_logs;
CREATE POLICY "Everyone can create logs" ON activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Dismissed notifications
DROP POLICY IF EXISTS "Authenticated users can dismiss notifications" ON dismissed_notifications;
CREATE POLICY "Authenticated users can dismiss notifications" ON dismissed_notifications FOR INSERT TO authenticated
  WITH CHECK (dismissed_by_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view dismissals" ON dismissed_notifications;
CREATE POLICY "Authenticated users can view dismissals" ON dismissed_notifications FOR SELECT TO authenticated
  USING (dismissed_by_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can clear dismissals" ON dismissed_notifications;
CREATE POLICY "Users can clear own dismissals" ON dismissed_notifications FOR DELETE TO authenticated
  USING (dismissed_by_user_id = (select auth.uid()));

-- Loans
DROP POLICY IF EXISTS "Public can create loans" ON loans;
CREATE POLICY "Authenticated users can create loans" ON loans FOR INSERT TO authenticated
  WITH CHECK (borrowed_by_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Public can update loans" ON loans;
CREATE POLICY "Authenticated users can update loans" ON loans FOR UPDATE TO authenticated
  USING (borrowed_by_user_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')))
  WITH CHECK (borrowed_by_user_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));

-- Reservations
DROP POLICY IF EXISTS "Authenticated users can manage reservations" ON reservations;
DROP POLICY IF EXISTS "Everyone can view reservations" ON reservations;

CREATE POLICY "Everyone can view reservations" ON reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reservations" ON reservations FOR INSERT TO authenticated
  WITH CHECK (reserved_by_user_id = (select auth.uid()));
CREATE POLICY "Users can update own reservations" ON reservations FOR UPDATE TO authenticated
  USING (reserved_by_user_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')))
  WITH CHECK (reserved_by_user_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));
CREATE POLICY "Users can delete own reservations" ON reservations FOR DELETE TO authenticated
  USING (reserved_by_user_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role IN ('admin', 'coach')));

-- ============================================================================
-- PART 3: Update Functions with Security Definer and Search Path
-- ============================================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS trust_score_trigger ON loans;
DROP TRIGGER IF EXISTS late_return_counter_trigger ON loans;
DROP TRIGGER IF EXISTS loan_status_trigger ON loans;
DROP TRIGGER IF EXISTS clear_dismissals_on_suspension ON students;
DROP TRIGGER IF EXISTS clear_dismissals_on_suspension_trigger ON blacklist_entries;

-- Drop and recreate functions with security settings
DROP FUNCTION IF EXISTS auto_unblacklist_expired_suspensions() CASCADE;
DROP FUNCTION IF EXISTS count_student_suspensions(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_late_returns_since_last_suspension(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_warning_threshold(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_student_trust_score() CASCADE;
DROP FUNCTION IF EXISTS calculate_trust_score(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_late_return_counters() CASCADE;
DROP FUNCTION IF EXISTS update_loan_status() CASCADE;
DROP FUNCTION IF EXISTS clear_dismissed_notifications_on_suspension() CASCADE;

CREATE FUNCTION auto_unblacklist_expired_suspensions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE students SET is_blacklisted = false, blacklist_end_date = NULL, updated_at = now()
  WHERE is_blacklisted = true AND blacklist_end_date IS NOT NULL AND blacklist_end_date < now();
  UPDATE blacklist_entries SET is_active = false WHERE is_active = true AND end_date < now();
END;
$$;

CREATE FUNCTION count_student_suspensions(student_uuid uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE suspension_count integer;
BEGIN
  SELECT COUNT(*) INTO suspension_count FROM blacklist_entries WHERE student_id = student_uuid;
  RETURN COALESCE(suspension_count, 0);
END;
$$;

CREATE FUNCTION get_late_returns_since_last_suspension(student_uuid uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  last_suspension_end timestamptz;
  late_count integer;
BEGIN
  SELECT end_date INTO last_suspension_end FROM blacklist_entries
  WHERE student_id = student_uuid ORDER BY end_date DESC LIMIT 1;
  
  IF last_suspension_end IS NULL THEN
    SELECT COUNT(*) INTO late_count FROM loans
    WHERE student_id = student_uuid AND returned_at IS NOT NULL AND returned_at > due_at;
  ELSE
    SELECT COUNT(*) INTO late_count FROM loans
    WHERE student_id = student_uuid AND returned_at IS NOT NULL 
    AND returned_at > due_at AND returned_at > last_suspension_end;
  END IF;
  
  RETURN COALESCE(late_count, 0);
END;
$$;

CREATE FUNCTION get_warning_threshold(student_uuid uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  suspension_count integer;
  late_returns_since_suspension integer;
  threshold integer;
BEGIN
  suspension_count := count_student_suspensions(student_uuid);
  late_returns_since_suspension := get_late_returns_since_last_suspension(student_uuid);
  IF suspension_count > 0 THEN RETURN 1; END IF;
  IF late_returns_since_suspension < 4 THEN
    threshold := late_returns_since_suspension + 1;
  ELSE
    threshold := 4;
  END IF;
  RETURN threshold;
END;
$$;

CREATE FUNCTION calculate_trust_score(student_uuid uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  total_loans integer;
  on_time_returns integer;
  late_returns integer;
  current_overdue integer;
  is_blacklisted boolean;
  score integer;
BEGIN
  SELECT COUNT(*) INTO total_loans FROM loans WHERE student_id = student_uuid;
  SELECT COUNT(*) INTO on_time_returns FROM loans WHERE student_id = student_uuid AND returned_at IS NOT NULL AND returned_at <= due_at;
  SELECT COUNT(*) INTO late_returns FROM loans WHERE student_id = student_uuid AND returned_at IS NOT NULL AND returned_at > due_at;
  SELECT COUNT(*) INTO current_overdue FROM loans WHERE student_id = student_uuid AND status = 'overdue';
  SELECT students.is_blacklisted INTO is_blacklisted FROM students WHERE id = student_uuid;
  
  score := 100;
  IF is_blacklisted THEN score := score - 40; END IF;
  score := score - (current_overdue * 15) - (late_returns * 5);
  IF total_loans > 0 THEN score := score + ((on_time_returns::float / total_loans::float) * 20)::integer; END IF;
  IF score < 0 THEN score := 0; END IF;
  IF score > 100 THEN score := 100; END IF;
  
  RETURN score;
END;
$$;

CREATE FUNCTION update_student_trust_score()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE new_trust_score integer;
BEGIN
  new_trust_score := calculate_trust_score(NEW.student_id);
  UPDATE students SET trust_score = new_trust_score WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$;

CREATE FUNCTION update_late_return_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  late_count integer;
  late_since_suspension integer;
BEGIN
  IF NEW.returned_at IS NOT NULL AND NEW.returned_at > NEW.due_at THEN
    SELECT COUNT(*) INTO late_count FROM loans WHERE student_id = NEW.student_id AND returned_at IS NOT NULL AND returned_at > due_at;
    late_since_suspension := get_late_returns_since_last_suspension(NEW.student_id);
    UPDATE students SET total_late_returns = late_count, late_returns_since_suspension = late_since_suspension WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION update_loan_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.returned_at IS NULL AND NEW.due_at < now() THEN
    NEW.is_overdue := true;
    NEW.status := 'overdue';
  ELSIF NEW.returned_at IS NOT NULL THEN
    NEW.status := 'returned';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION clear_dismissed_notifications_on_suspension()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM dismissed_notifications WHERE student_id = NEW.student_id;
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER trust_score_trigger AFTER INSERT OR UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_student_trust_score();

CREATE TRIGGER late_return_counter_trigger AFTER INSERT OR UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_late_return_counters();

CREATE TRIGGER loan_status_trigger BEFORE INSERT OR UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_loan_status();

CREATE TRIGGER clear_dismissals_on_suspension_trigger AFTER INSERT ON blacklist_entries
  FOR EACH ROW EXECUTE FUNCTION clear_dismissed_notifications_on_suspension();
