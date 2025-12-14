/*
  # School Sports Equipment Management System - Initial Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - References auth.users
      - `email` (text) - User email
      - `full_name` (text) - User's full name
      - `role` (text) - admin, coach, sports_captain
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `students`
      - `id` (uuid, primary key)
      - `student_id` (text, unique) - School student ID number
      - `full_name` (text) - Student's full name
      - `year_group` (text) - Year 7, Year 8, Year 9, Staff
      - `class_name` (text) - e.g., 10B, 11A
      - `house` (text) - School house name
      - `email` (text) - Student email
      - `avatar_url` (text) - Profile picture URL
      - `trust_score` (numeric) - Calculated 0-100 based on return history
      - `is_blacklisted` (boolean) - Suspension status
      - `blacklist_end_date` (timestamp) - When suspension ends
      - `blacklist_reason` (text) - Reason for suspension
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `equipment_items`
      - `id` (uuid, primary key)
      - `item_id` (text, unique) - Equipment ID like BB-001
      - `name` (text) - Equipment name
      - `category` (text) - Football, Basketball, Tennis, etc.
      - `image_url` (text) - Equipment photo URL
      - `location` (text) - Storage location
      - `status` (text) - available, borrowed, reserved, repair
      - `condition_notes` (text) - Notes about condition
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `loans`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key) - References students
      - `equipment_id` (uuid, foreign key) - References equipment_items
      - `borrowed_by_user_id` (uuid) - References users who processed loan
      - `borrowed_at` (timestamp) - When item was borrowed
      - `due_at` (timestamp) - When item should be returned
      - `returned_at` (timestamp, nullable) - When item was actually returned
      - `is_overdue` (boolean) - Calculated field
      - `status` (text) - active, returned, overdue
      - `created_at` (timestamp)
    
    - `reservations`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key) - References students
      - `equipment_id` (uuid, foreign key) - References equipment_items
      - `reserved_by_user_id` (uuid) - References users
      - `start_time` (timestamp) - Reservation start
      - `end_time` (timestamp) - Reservation end
      - `status` (text) - upcoming, active, completed, cancelled
      - `created_at` (timestamp)
    
    - `blacklist_entries`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key) - References students
      - `blacklisted_by_user_id` (uuid) - References users
      - `start_date` (timestamp) - When blacklist started
      - `end_date` (timestamp) - When blacklist ends
      - `reason` (text) - Reason for blacklist
      - `is_active` (boolean) - Current status
      - `created_at` (timestamp)
    
    - `settings`
      - `id` (uuid, primary key)
      - `school_name` (text)
      - `academic_year` (text)
      - `overdue_alerts_enabled` (boolean)
      - `low_stock_warnings_enabled` (boolean)
      - `email_digest_frequency` (text) - daily, weekly
      - `borrow_history_retention_months` (integer)
      - `require_student_id` (boolean)
      - `app_version` (text)
      - `updated_at` (timestamp)
    
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References users
      - `action` (text) - borrow, return, blacklist, etc.
      - `entity_type` (text) - student, equipment, loan
      - `entity_id` (uuid) - Reference to entity
      - `details` (jsonb) - Additional details
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'sports_captain' CHECK (role IN ('admin', 'coach', 'sports_captain')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  year_group text NOT NULL,
  class_name text,
  house text,
  email text,
  avatar_url text,
  trust_score numeric DEFAULT 50.0 CHECK (trust_score >= 0 AND trust_score <= 100),
  is_blacklisted boolean DEFAULT false,
  blacklist_end_date timestamptz,
  blacklist_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create equipment_items table
CREATE TABLE IF NOT EXISTS equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  image_url text,
  location text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved', 'repair')),
  condition_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment_items(id) ON DELETE CASCADE,
  borrowed_by_user_id uuid REFERENCES users(id),
  borrowed_at timestamptz DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  is_overdue boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  created_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment_items(id) ON DELETE CASCADE,
  reserved_by_user_id uuid REFERENCES users(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create blacklist_entries table
CREATE TABLE IF NOT EXISTS blacklist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  blacklisted_by_user_id uuid REFERENCES users(id),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  reason text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text DEFAULT 'Sports Academy',
  academic_year text DEFAULT '2024-2025',
  overdue_alerts_enabled boolean DEFAULT true,
  low_stock_warnings_enabled boolean DEFAULT true,
  email_digest_frequency text DEFAULT 'daily' CHECK (email_digest_frequency IN ('daily', 'weekly')),
  borrow_history_retention_months integer DEFAULT 12,
  require_student_id boolean DEFAULT true,
  app_version text DEFAULT '1.0.0',
  updated_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policies for students table
CREATE POLICY "Authenticated users can view students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and coaches can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach')
    )
  );

CREATE POLICY "Admins and coaches can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach')
    )
  );

CREATE POLICY "Admins can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for equipment_items table
CREATE POLICY "Everyone can view equipment"
  ON equipment_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and coaches can manage equipment"
  ON equipment_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach')
    )
  );

-- Policies for loans table
CREATE POLICY "Everyone can view loans"
  ON loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for reservations table
CREATE POLICY "Everyone can view reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage reservations"
  ON reservations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for blacklist_entries table
CREATE POLICY "Admins and coaches can manage blacklist"
  ON blacklist_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'coach')
    )
  );

-- Policies for settings table
CREATE POLICY "Everyone can view settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for activity_logs table
CREATE POLICY "Admins can view all logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Everyone can create logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(student_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_returns integer;
  on_time_returns integer;
  score numeric;
BEGIN
  -- Count total completed loans
  SELECT COUNT(*)
  INTO total_returns
  FROM loans
  WHERE student_id = student_uuid
  AND returned_at IS NOT NULL;
  
  -- If no returns yet, return default score
  IF total_returns = 0 THEN
    RETURN 50.0;
  END IF;
  
  -- Count on-time returns (returned before or at due time)
  SELECT COUNT(*)
  INTO on_time_returns
  FROM loans
  WHERE student_id = student_uuid
  AND returned_at IS NOT NULL
  AND returned_at <= due_at;
  
  -- Calculate percentage
  score := (on_time_returns::numeric / total_returns::numeric) * 100;
  
  RETURN ROUND(score, 1);
END;
$$ LANGUAGE plpgsql;

-- Create function to update loan status
CREATE OR REPLACE FUNCTION update_loan_status()
RETURNS trigger AS $$
BEGIN
  -- Update overdue status
  IF NEW.returned_at IS NULL AND NEW.due_at < now() THEN
    NEW.is_overdue := true;
    NEW.status := 'overdue';
  ELSIF NEW.returned_at IS NOT NULL THEN
    NEW.status := 'returned';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loan status updates
DROP TRIGGER IF EXISTS loan_status_trigger ON loans;
CREATE TRIGGER loan_status_trigger
  BEFORE INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_status();

-- Create function to update student trust score after return
CREATE OR REPLACE FUNCTION update_student_trust_score()
RETURNS trigger AS $$
BEGIN
  -- Only update when a loan is returned
  IF NEW.returned_at IS NOT NULL AND (OLD.returned_at IS NULL OR OLD.returned_at IS DISTINCT FROM NEW.returned_at) THEN
    UPDATE students
    SET trust_score = calculate_trust_score(NEW.student_id),
        updated_at = now()
    WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trust score updates
DROP TRIGGER IF EXISTS trust_score_trigger ON loans;
CREATE TRIGGER trust_score_trigger
  AFTER INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_student_trust_score();

-- Insert default settings
INSERT INTO settings (id, school_name, academic_year)
VALUES (gen_random_uuid(), 'Springfield Sports Academy', '2024-2025')
ON CONFLICT DO NOTHING;